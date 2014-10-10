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
 
 