---
title: Volatility 3 内存取证
date: 2026-11-19 11:00:00
author: Xendr1a
categories: [工具与运维]
tags: [取证, Volatility]
description: Volatility 3 内存取证，按用途与常用参数整理。
toc: true
---

## 命令

```text
操作系统信息查看

./vol.py -f file.dmp windows.info.Info
hash值，密码提取：SAM哈希，域缓存凭据和LSA密码

./vol.py -f file.dmp windows.hashdump.Hashdump #获取常见的 Windows 哈希（SAM+SYSTEM）
./vol.py -f file.dmp windows.cachedump.Cachedump #提取注册表中的域缓存哈希
./vol.py -f file.dmp windows.lsadump.Lsadump #提取 LSA 密码
内存转储

 vol.py -f mydump.vmem -o <out_path> windows.memmap.Memmap --pid <pid> --dump

如果失败就使用

python vol.py -f mydump.vmem -o <out_path> windows.pslist.PsList --pid <pid> --dump

进程信息

python3 vol.py -f file.dmp windows.pstree.PsTree # 获取进程树（非隐藏）
python3 vol.py -f file.dmp windows.pslist.PsList # 获取进程列表（EPROCESS）
python3 vol.py -f file.dmp windows.psscan.PsScan # 获取隐藏进程列表（恶意软件）
转储进程

./vol.py -f file.dmp windows.dumpfiles.DumpFiles --pid <pid> #Dump the .exe and dlls of the process in the current directory
命令行

python3 vol.py -f file.dmp windows.cmdline.CmdLine # 显示进程命令行参数
环境变量

python3 vol.py -f file.dmp windows.envars.Envars [--pid <pid>] # 显示进程的环境变量
Token privileges检查意外的权限令牌，列出使用某些权限令牌的进程
# 获取某些进程的启用权限
python3 vol.py -f file.dmp windows.privileges.Privs [--pid <pid>]
# 获取所有具有权限的进程
python3 vol.py -f file.dmp windows.privileges.Privs | grep "SeImpersonatePrivilege|SeAssignPrimaryPrivilege|SeTcbPrivilege|SeBackupPrivilege|SeRestorePrivilege|SeCreateTokenPrivilege|SeLoadDriverPrivilege|SeTakeOwnershipPrivilege|SeDebugPrivilege"
SIDs检查每个进程拥有的SSID，列出使用权限SID（或使用某些服务SID）的进程

./vol.py -f file.dmp windows.getsids.GetSIDs [--pid <pid>] # 获取进程的 SID
./vol.py -f file.dmp windows.getservicesids.GetServiceSIDs # 获取服务的 SID
句柄，了解进程拥有的句柄（一打开文件，注册表项，线程，进程等）

vol.py -f file.dmp windows.handles.Handles [--pid <pid>]
DLLs

./vol.py -f file.dmp windows.dlllist.DllList [--pid <pid>] # 列出每个进程使用的 dlls
./vol.py -f file.dmp windows.dumpfiles.DumpFiles --pid <pid> # 转储进程的 .exe 和 dll 文件到当前目录
按进程查看字符串

strings file.dmp > /tmp/strings.txt
./vol.py -f /tmp/file.dmp windows.strings.Strings --strings-file /tmp/strings.txt  //检查字符串属于哪个进程
./vol.py -f file.dmp windows.vadyarascan.VadYaraScan --yara-rules "https://" --pid 3692 3840 3976 3312 3084 2784
./vol.py -f file.dmp yarascan.YaraScan --yara-rules "https://"    //使用yarascan模块在进程中搜索字符串
UserAssist通过注册表追踪运行过的程序，记录每个程序运行的次数以及最后一次运行时间

./vol.py -f file.dmp windows.registry.userassist.UserAssist
服务

./vol.py -f file.dmp windows.svcscan.SvcScan # 列出服务
./vol.py -f file.dmp windows.getservicesids.GetServiceSIDs # 获取服务的SID
网络

./vol.py -f file.dmp windows.netscan.NetScan
注册表

打印可用注册表

./vol.py -f file.dmp windows.registry.hivelist.HiveList # 列出根项
./vol.py -f file.dmp windows.registry.printkey.PrintKey # 列出根项并获取初始子项
获取一个注册表值

volatility --profile=Win7SP1x86_23418 printkey -K "SoftwareMicrosoftWindows NTCurrentVersion" -f file.dmp
# 获取“运行”二进制注册表值
volatility -f file.dmp --profile=Win7SP1x86 printkey -o 0x9670e9d0 -K 'SoftwareMicrosoftWindowsCurrentVersionRun'
转储注册表

暂无

文件系统

暂无

扫描/转储文件

./vol.py -f file.dmp windows.filescan.FileScan # 扫描转储中的文件
./vol.py -f file.dmp windows.dumpfiles.DumpFiles --physaddr <0xAAAAA> # 从上一个命令获取的偏移地址
主文件表

暂无

SSL密钥/证书

# vol3 允许从注册表中搜索证书
./vol.py -f file.dmp windows.registry.certificates.Certificates
恶意软件分析

./vol.py -f file.dmp windows.malfind.Malfind [--dump] # 查找隐藏和注入的代码，[转储每个可疑部分]
# Malfind 会搜索与恶意软件相关的可疑结构
./vol.py -f file.dmp windows.driverirp.DriverIrp # 驱动 IRP 挂钩检测
./vol.py -f file.dmp windows.ssdt.SSDT # 检查系统调用地址是否来自意外地址

./vol.py -f file.dmp linux.check_afinfo.Check_afinfo # 验证网络协议的操作函数指针
./vol.py -f file.dmp linux.check_creds.Check_creds # 检查是否有进程共享凭据结构
./vol.py -f file.dmp linux.check_idt.Check_idt # 检查 IDT 是否已被修改
./vol.py -f file.dmp linux.check_syscall.Check_syscall # 检查系统调用表是否有挂钩
./vol.py -f file.dmp linux.check_modules.Check_modules # 比较模块列表与 sysfs 信息（如果可用）
./vol.py -f file.dmp linux.tty_check.tty_check # 检查 tty 设备是否有挂钩
使用 YARA 扫描
wget https://gist.githubusercontent.com/andreafortuna/29c6ea48adf3d45a979a78763cdc7ce9/raw/4ec711d37f1b428b63bed1f786b26a0654aa2f31/malware_yara_rules.py
mkdir rules
python malware_yara_rules.py
#Only Windows
./vol.py -f file.dmp windows.vadyarascan.VadYaraScan --yara-file /tmp/malware_rules.yar
#All
./vol.py -f file.dmp yarascan.YaraScan --yara-file /tmp/malware_rules.yar
其他工具

自动运行

暂无

互斥锁

./vol.py -f file.dmp windows.mutantscan.MutantScan
符号链接（Symlinks）
./vol.py -f file.dmp windows.symlinkscan.SymlinkScan
bash历史

./vol.py -f file.dmp linux.bash.Bash
时间线

./vol.py -f file.dmp timeLiner.TimeLiner
驱动程序

./vol.py -f file.dmp windows.driverscan.DriverScan
获取剪贴板内容
暂无

获取 Internet Explorer 历史
暂无

获取记事本文本

暂无

截屏（Screenshot）
暂无

主引导记录（MBR）
暂无
```

## 命令格式

Volatility 3命令结构与 Volatility 2 相似。

```text
vol -f <memory dump file> <plugin> [options]
-f <memory dump file>：指定分析的内存转储文件。
```

注意：在 Volatility 3 中，Profile 的概念被改为适配特定操作系统的自动探测。

```text
<plugin>：选择要运行的插件，插件用于提取不同类型的信息。
[options]：可选参数，针对插件的特定配置。
```

## 默认插件

```text
   banners.Banners：尝试在图像中识别潜在的 Linux 标识。
   configwriter.ConfigWriter：运行自动化操作，并在输出目录中打印和输出配置。
   frameworkinfo.FrameworkInfo：列出 Volatility 中各种模块组件的插件。
   isfinfo.IsfInfo：确定当前可用的 ISF 文件的信息，或特定的文件信息。
   layerwriter.LayerWriter：运行自动化操作并写出堆栈器产生的主层。
   linux.bash.Bash：从内存中恢复 bash 命令历史记录。
   linux.capabilities.Capabilities：列出进程的能力。
   linux.check_afinfo.Check_afinfo：验证网络协议的操作函数指针。
   linux.check_creds.Check_creds：检查是否有进程共享凭证结构。
   linux.check_idt.Check_idt：检查 IDT（中断描述符表）是否被修改。
   linux.check_modules.Check_modules：将模块列表与 sysfs 信息进行比较（如果可用）。
   linux.check_syscall.Check_syscall：检查系统调用表中的挂钩。
   linux.elfs.Elfs：列出所有进程的内存映射 ELF 文件。
   linux.envars.Envars：列出进程及其环境变量。
   linux.iomem.IOMem：生成类似于正在运行的系统中 /proc/iomem 的输出。
   linux.keyboard_notifiers.Keyboard_notifiers：解析键盘通知回调链。
   linux.kmsg.Kmsg：内核日志缓冲区读取器。
   linux.library_list.LibraryList：枚举加载到进程中的库。
   linux.lsmod.Lsmod：列出已加载的内核模块。
   linux.lsof.Lsof：列出所有进程的内存映射。
   linux.malfind.Malfind：列出可能包含注入代码的进程内存范围。
   linux.mountinfo.MountInfo：列出进程的挂载命名空间中的挂载点。
   linux.netfilter.Netfilter：列出 Netfilter 钩子。
   linux.proc.Maps：列出所有进程的内存映射。
   linux.psaux.PsAux：列出进程及其命令行参数。
   linux.pslist.PsList：列出特定 Linux 内存映像中存在的进程。
   linux.psscan.PsScan：扫描特定 Linux 映像中存在的进程。
   linux.pstree.PsTree：基于父进程 ID 列出进程树的插件。
   linux.sockstat.Sockstat：列出所有进程的网络连接。
   linux.tty_check.tty_check：检查 tty 设备是否有钩子。
   linux.vmayarascan.VmaYaraScan：扫描所有虚拟内存区域，使用 YARA 扫描任务。
   mac.bash.Bash：从内存中恢复 bash 命令历史记录。
   mac.check_syscall.Check_syscall：检查系统调用表中的挂钩。
   mac.check_sysctl.Check_sysctl：检查 sysctl 处理程序中的挂钩。
   mac.check_trap_table.Check_trap_table：检查 Mach trap 表中的挂钩。
   mac.dmesg.Dmesg：打印内核日志缓冲区。
   mac.ifconfig.Ifconfig：列出所有设备的网络接口信息。
   mac.kauth_listeners.Kauth_listeners：列出 kauth 监听器及其状态。
   mac.kauth_scopes.Kauth_scopes：列出 kauth 范围及其状态。
   mac.kevents.Kevents：列出进程注册的事件处理程序。
   mac.list_files.List_Files：列出所有进程的打开文件描述符。
   mac.lsmod.Lsmod：列出已加载的内核模块。
   mac.lsof.Lsof：列出所有进程的打开文件描述符。
   mac.malfind.Malfind：列出可能包含注入代码的进程内存范围。
   mac.mount.Mount：一个包含多个插件的模块，通常用于列出 Mac 的挂载命令数据。
   mac.netstat.Netstat：列出所有进程的网络连接。
   mac.proc_maps.Maps：列出进程内存范围，可能包含注入代码。
   mac.psaux.Psaux：恢复程序命令行参数。
   mac.pslist.PsList：列出特定 Mac 内存映像中存在的进程。
   mac.pstree.PsTree：基于父进程 ID 列出进程树的插件。
   mac.socket_filters.Socket_filters：枚举内核套接字过滤器。
   mac.timers.Timers：检查恶意的内核定时器。
   mac.trustedbsd.Trustedbsd：检查恶意的 trustedbsd 模块。
   mac.vfsevents.VFSevents：列出过滤文件系统事件的进程。
   timeliner.Timeliner：运行所有相关插件，提供按时间排序的时间相关信息。
   vmscan.Vmscan：扫描 Intel VT-d 结构并为其生成虚拟机 Volatility 配置。
   windows.bigpools.BigPools：列出大页池。
   windows.cachedump.Cachedump：从内存中转储 LSA 密码。
   windows.callbacks.Callbacks：列出内核回调和通知例程。
   windows.cmdline.CmdLine：列出进程的命令行参数。
   windows.crashinfo.Crashinfo：列出 Windows 崩溃转储中的信息。
   windows.devicetree.DeviceTree：根据驱动程序和附加设备列出 Windows 内存映像中的树形结构。
   windows.dlllist.DllList：列出 Windows 内存映像中加载的模块。
   windows.driverirp.DriverIrp：列出 Windows 内存映像中驱动程序的 IRP。
   windows.drivermodule.DriverModule：确定是否有加载的驱动程序被 rootkit 隐藏。
   windows.driverscan.DriverScan：扫描特定 Windows 内存映像中的驱动程序。
   windows.dumpfiles.DumpFiles：转储 Windows 内存样本中的缓存文件内容。
   windows.envars.Envars：显示进程环境变量。
   windows.filescan.FileScan：扫描特定 Windows 内存映像中的文件对象。
   windows.getservicesids.GetServiceSIDs：列出进程令牌的 SID。
   windows.getsids.GetSIDs：打印拥有每个进程的 SID。
   windows.handles.Handles：列出进程的打开句柄。
   windows.hashdump.Hashdump：从内存中转储用户哈希。
   windows.hollowprocesses.HollowProcesses：列出空洞化的进程。
   windows.iat.IAT：提取导入地址表（IAT），列出程序所使用的外部库中的 API（函数）。
   windows.info.Info：显示内存样本的操作系统和内核详细信息。
   windows.joblinks.JobLinks：打印进程的作业链接信息。  
   windows.kernelcallbacks.KernelCallbacks：列出 Windows 内核回调。
   windows.kdbgscan.KDBGScan：扫描 Windows 内存映像中的 KDBG（内核调试符号）。
   windows.malfind.Malfind：列出可能包含注入代码的进程内存范围。
   windows.memmap.MemMap：显示进程的内存映射。
   windows.mimikatz.Mimikatz：提取内存中存储的凭证。
   windows.modules.Modules：列出 Windows 内存映像中加载的模块。
   windows.netstat.Netstat：列出 Windows 网络连接。
   windows.netscan.NetScan：扫描 Windows 网络连接。
   windows.osinfo.OSInfo：显示操作系统的详细信息。
   windows.pagedpool.PagedPool：列出 Windows 内存中的分页池。
   windows.patches.Patches：列出 Windows 系统的补丁和更新信息。
   windows.pefile.PEFile：解析 Windows 可执行文件（PE 文件）头信息。
   windows.printspool.PrintSpool：列出 Windows 打印队列的详细信息。
   windows.processinfo.ProcessInfo：列出 Windows 系统中所有进程的信息。
   windows.procdump.ProcDump：转储 Windows 进程的内存。
   windows.pslist.PsList：列出 Windows 内存映像中的进程。
   windows.registry.Registry：列出 Windows 注册表的内容。
   windows.regripper.RegRipper：使用注册表转储信息提取 Windows 配置。
   windows.sockets.Sockets：列出 Windows 内存映像中的套接字。
   windows.suspend.Suspend：暂停指定的进程。
   windows.syscalls.Syscalls：列出 Windows 系统调用。
   windows.tasks.Tasks：列出 Windows 内存映像中的任务。
   windows.timers.Timers：列出 Windows 系统中的定时器。
   windows.userhandles.UserHandles：列出 Windows 内存中的用户模式句柄。
   windows.usbscan.UsbScan：扫描 Windows 系统中的 USB 设备。
   windows.vadinfo.VADInfo：列出 Windows 内存映像中的虚拟地址区域（VAD）。
   windows.volshell.VolShell：通过命令行与 Volatility 进行交互。
   windows.win32k.Win32k：列出 Windows 图形和输入子系统的信息。
```
