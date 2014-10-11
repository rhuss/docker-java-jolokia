# Spicy Docker Java Image with Jolokia

This repository holds automated builds for variants of the official [java](https://registry.hub.docker.com/_/java)
Java docker image which allow to easily start a [Jolokia](http://www.jolokia.org) agent.

In order to use the agent, a child image which inherits from this image should call `jolokia_opts`, which echos all 
relevant options which should be included as argument to the Java startup command.

Here is a simple example for creating a Tomcat 7 images which starts Jolokia along with tomcat:

````
FROM jolokia/java-jolokia:7
ENV TOMCAT_VERSION 7.0.55
ENV TC apache-tomcat-${TOMCAT_VERSION}

EXPOSE 8080 8778
RUN wget http://archive.apache.org/dist/tomcat/tomcat-7/v${TOMCAT_VERSION}/bin/${TC}.tar.gz
RUN tar xzf ${TC}.tar.gz -C /opt

CMD env CATALINA_OPTS=$(jolokia_opts) /opt/${TC}/bin/catalina.sh run
````

(Don't forget to use `$(jolokia_opts)` or with backticks, but not `${jolokia_opts}`)

The configuration of the Jolokia agent can be influenced with various environments variables. Please refer to the 
[README](openjdk-7)s of the various image variants.
 
## Build system
 
 For generating the images a simple node.js based templating script is used. The templates can be found in the 
 directory `templates` which uses the [doT](http://olado.github.io/doT/index.html) templating library. All you need is 
 to adapt `config.json` if to upgrade the version number or adding a new build. 
 
 For the initial setup, `npm install` needs to install some dependencies. 
  
 `./build.js` will create the final automated build from the configuration and the templates. When calling `./build.js -b`
 then all images are build locally when a Docker daemon is running (and `DOCKER_HOST` is set properly). With `./build.js -h` 
 a short help message is printed.

## Drive-By Jolokia 

(*by courtesy of @paoloantinori*)

There a circumstance where you can't use these images as a base because you have to use ready-made images.
In that case you can still use the  Jolokia JVM agent capability to attach to an already running Java process by
injecting the agent to an already running process

For example if use the stock [Wildfly](https://github.com/jboss/dockerfiles/blob/master/wildfly/Dockerfile) Image, then
you can inject Jolokia with the following command:

```bash
docker run \
  -P -p 8778 \
  -v /data/installers/jolokia-jvm-1.2.2-agent.jar:/opt/jolokia/jolokia.jar \
  -it jboss/wildfly  \
  sh -c 'exec /opt/wildfly/bin/standalone.sh  -b 0.0.0.0 -bmanagement 0.0.0.0 &  \
  while ! curl -m 10 http://localhost:8080 ; do echo still down ; sleep 1s ; done ; \
  java -jar /opt/jolokia/jolokia.jar --host 0.0.0.0 ".*jboss-modules.*"; \
  sh'
```

Where:
- `/data/installers/jolokia-jvm-1.2.2-agent.jar` is a path on your host to the Jolokia JVM agent
- `while ! curl -m 10 http://localhost:8080 ; do echo still down ; sleep 1s ; done ;` is needed due to peculiar behavior of Wildfly, classloading and agents. Basically we are just waiting for Wildfly to be up and running.
- `".*jboss-modules.*"` is a regexp to identify a unique process in the output of `ps ax`
- instead of using `-v` to inject a host file inside the container you could consider a more portable approach with **Docker data only containers**. See this [blog post](http://www.tech-d.net/2013/12/16/persistent-volumes-with-docker-container-as-volume-pattern/) for an explanation of this pattern
  
