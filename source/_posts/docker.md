---
title: Docker 常用命令
date: 2026-11-18 10:00:00
author: Xendr1a
categories: [工具与运维]
tags: [Docker, 运维]
description: Docker 常用命令，按用途与常用参数整理。
toc: true
---

## Docker的常用命令

1. Docker运行  
要在Docker中运行容器，可以使用以下命令：

docker run [OPTIONS] IMAGE [COMMAND] [ARG...]  
1  
• docker run：运行容器的命令。

• [OPTIONS]：可选参数，用于配置容器的各种选项，如端口映射、容器名称等。

• IMAGE：要运行的镜像名称或ID。

• [COMMAND] [ARG...]：可选的命令和参数，用于在容器内执行特定的命令。

1. Docker构建  
要构建自己的Docker镜像，可以使用以下命令：

docker build [OPTIONS] PATH | URL | -  
1  
• docker build：构建镜像的命令。

• [OPTIONS]：可选参数，用于配置构建过程，如镜像标签、构建上下文路径等。

• PATH | URL | -：Dockerfile所在的路径、URL或者使用标准输入作为Dockerfile。

1. Docker pull  
要从Docker仓库中拉取现有的镜像，可以使用以下命令：

docker pull [OPTIONS] NAME[:TAG|@DIGEST]  
1  
• docker pull：拉取镜像的命令。

• [OPTIONS]：可选参数，用于配置拉取过程，如认证信息等。

• NAME[:TAG|@DIGEST]：要拉取的镜像名称、标签或摘要。

1. Docker push  
要将本地的镜像推送到Docker仓库，可以使用以下命令：

docker push [OPTIONS] NAME[:TAG]  
1  
• docker push：推送镜像的命令。

• [OPTIONS]：可选参数，用于配置推送过程，如认证信息等。

• NAME[:TAG]：要推送的镜像名称和标签。

1. Docker images  
要列出本地所有的镜像，可以使用以下命令：

docker images [OPTIONS] [REPOSITORY[:TAG]]  
1  
• docker images：列出镜像的命令。

• [OPTIONS]：可选参数，用于配置输出结果的格式等。

• [REPOSITORY[:TAG]]：可选的镜像名称和标签，用于过滤输出结果。

1. Docker ps  
要列出正在运行的容器，可以使用以下命令：

docker ps [OPTIONS]  
1  
• docker ps：列出容器的命令。

• [OPTIONS]：可选参数，用于配置输出结果的格式和过滤条件。

1. Docker stop  
要停止正在运行的容器，可以使用以下命令：

docker stop [OPTIONS] CONTAINER [CONTAINER...]  
1  
• docker stop：停止容器的命令。

• [OPTIONS]：可选参数，用于配置停止过程，如超时时间等。

• CONTAINER [CONTAINER...]：要停止的容器名称或ID。

1. Docker start  
要启动已停止的容器，可以使用以下命令：

docker start [OPTIONS] CONTAINER [CONTAINER...]  
1  
• docker start：启动容器的命令。

• [OPTIONS]：可选参数，用于配置启动过程，如守护模式等。

• CONTAINER [CONTAINER...]：要启动的容器名称或ID。

1. Docker restart  
要重启正在运行的容器，可以使用以下命令：

docker restart [OPTIONS] CONTAINER [CONTAINER...]  
1  
• docker restart：重启容器的命令。

• [OPTIONS]：可选参数，用于配置重启过程，如超时时间等。

• CONTAINER [CONTAINER...]：要重启的容器名称或ID。

1. Docker kill  
要强制终止正在运行的容器，可以使用以下命令：

docker kill [OPTIONS] CONTAINER [CONTAINER...]  
1  
• docker kill：终止容器的命令。

• [OPTIONS]：可选参数，用于配置终止过程，如信号等。

• CONTAINER [CONTAINER...]：要终止的容器名称或ID。

1. Docker rm/docker rmi  
要删除已停止的容器或镜像，可以使用以下命令：

docker rm [OPTIONS] CONTAINER [CONTAINER...]   docker rmi [OPTIONS] IMAGE [IMAGE...]  
1  
• docker rm：删除容器的命令。

• docker rmi：删除镜像的命令。

• [OPTIONS]：可选参数，用于配置删除过程，如强制删除等。

• CONTAINER [CONTAINER...]：要删除的容器名称或ID。

• IMAGE [IMAGE...]：要删除的镜像名称或ID。

1. Docker exec  
要在运行中的容器内执行命令，可以使用以下命令：

docker exec [OPTIONS] CONTAINER COMMAND [ARG...]  
1  
• docker exec：在容器内执行命令的命令。

• [OPTIONS]：可选参数，用于配置执行过程，如进入交互模式等。

• CONTAINER：要执行命令的容器名称或ID。

• COMMAND [ARG...]：要在容器内执行的命令及其参数。

1. Docker logs  
要查看容器的日志输出，可以使用以下命令：

docker logs [OPTIONS] CONTAINER  
1  
• docker logs：查看容器日志的命令。

• [OPTIONS]：可选参数，用于配置输出结果，如时间戳等。

• CONTAINER：要查看日志的容器名称或ID。

1. Docker inspect  
要获取容器或镜像的详细信息，可以使用以下命令：

docker inspect [OPTIONS] NAME|ID [NAME|ID...]  
1  
• docker inspect：获取详细信息的命令。

• [OPTIONS]：可选参数，用于配置输出结果的格式等。

• NAME|ID [NAME|ID...]：要获取信息的容器或镜像的名称或ID。

1. Docker cp  
要在容器和主机之间复制文件或目录，可以使用以下命令：

docker cp [OPTIONS] CONTAINER:SRC_PATH DEST_PATH   docker cp [OPTIONS] SRC_PATH|- CONTAINER:DEST_PATH  
1  
• docker cp：复制文件或目录的命令。

• [OPTIONS]：可选参数，用于配置复制过程，如权限等。

• CONTAINER:SRC_PATH：源路径，其中CONTAINER是容器名称或ID。

• DEST_PATH：目标路径，其中DEST_PATH是主机路径。

• SRC_PATH|-：源路径，其中-表示从标准输入读取。

1. Docker system prune  
要清理不再使用的镜像、容器和其他资源，可以使用以下命令：

docker system prune [OPTIONS]  
1  
• docker system prune：清理资源的命令。

• [OPTIONS]：可选参数，用于配置清理过程，如强制删除等。

1. Docker network  
Docker网络允许容器之间进行通信和连接到外部网络。以下是一些与Docker网络相关的常用命令：

• docker network ls：列出所有的Docker网络。

• docker network create：创建一个新的Docker网络。

• docker network connect：将容器连接到指定的Docker网络。

• docker network disconnect：将容器从指定的Docker网络断开连接。

1. Docker volume  
Docker卷用于在容器和主机之间持久化存储数据。以下是一些与Docker卷相关的常用命令：

• docker volume ls：列出所有的Docker卷。

• docker volume create：创建一个新的Docker卷。

• docker volume inspect：获取Docker卷的详细信息。

• docker volume rm：删除指定的Docker卷。

1. Docker-compose  
Docker-compose是一个用于定义和运行多个容器应用程序的工具。它使用YAML文件来配置应用程序的服务、网络和卷等。以下是一些与Docker-compose相关的常用命令：

• docker-compose up：构建并启动Docker-compose定义的所有服务。

• docker-compose down：停止并删除Docker-compose定义的所有服务。

• docker-compose build：构建Docker-compose定义的所有服务的镜像。

• docker-compose logs：查看Docker-compose定义的所有服务的日志。

1. Docker swarm  
Docker swarm是Docker的原生集群管理和编排工具，用于在多个Docker主机上运行和管理应用程序。以下是一些与Docker swarm相关的常用命令：

• docker swarm init：初始化一个新的Docker swarm集群。

• docker swarm join：将节点加入到Docker swarm集群。

• docker node ls：列出Docker swarm集群中的所有节点。

• docker service：管理在Docker swarm集群中运行的服务。

1. Dockerfile  
Dockerfile是用于定义Docker镜像构建过程的文本文件。它包含一系列的指令和配置，用于指导Docker引擎在构建过程中执行特定的操作。以下是一些与Dockerfile相关的常用命令：

• FROM：指定基础镜像。

• RUN：在容器内执行命令。

• COPY：将文件或目录从主机复制到容器内。

• ADD：将文件或目录从主机复制到容器内，并支持URL和解压缩操作。

• WORKDIR：设置工作目录。

• EXPOSE：声明容器运行时监听的端口。

• CMD：指定容器启动时要执行的命令。

这些命令可以在Dockerfile中按照特定的顺序组合使用，以定义和构建自定义的Docker镜像。

1. Docker登录和认证  
要登录到Docker仓库或私有镜像仓库，可以使用以下命令：

• docker login：登录到Docker仓库。

• docker logout：退出登录。

登录后，您可以使用docker pull和docker push命令来拉取和推送镜像。

1. Docker容器日志管理  
除了使用docker logs命令查看容器日志外，还可以使用以下命令对容器日志进行管理：

• docker logs --tail：只显示最后几行的日志。

• docker logs --follow：实时跟踪容器的日志输出。

• docker logs --since：只显示特定时间之后的日志。

• docker logs --until：只显示特定时间之前的日志。
