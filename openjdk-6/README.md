## Java Image with Jolokia

This image is based on the official [java](https://registry.hub.docker.com/_/java) image and 
includes a Jolokia JVM agent. The agent is installed as `/opt/jolokia/jolokia.jar`. 

In order to enable Jolokia for your application you should use this 
image as a base image (via `FROM`) and use the output of `jolokia_opts` in 
your startup scripts to include it in your startup options. 

For example, the following snippet can be added to a script starting up your 
Java application

    # ...
    export JAVA_OPTIONS="$JAVA_OPTIONS $(jolokia_opts)"
    # .... us JAVA_OPTIONS when starting your app, e.g. as Tomcat does

You can influence the behaviour `jolokia_opts` by setting various environment 
variables:

* **JOLOKIA_OFF** : If set disables activation of Jolokia (i.e. echos an empty value). By default, Jolokia is enabled. 
* **JOLOKIA_CONFIG** : If set uses this file (including path) as Jolokia JVM agent properties (as described in Jolokia's [reference manual](http://www.jolokia.org/reference/html/agents.html#agents-jvm)). By default this is `/opt/jolokia/jolokia.properties`. If this file exists, it be will taken as configuration and **any other config options are ignored**.  
* **JOLOKIA_HOST** : Host address to bind to (Default: 0.0.0.0)
* **JOLOKIA_PORT** : Port to use (Default: 8778)
* **JOLOKIA_USER** : User for authentication. By default authentication is switched off.
* **JOLOKIA_PASSWORD** : Password for authentication. By default authentication is switched off.
* **JOLOKIA_ID** : Agent ID to use (`$HOSTNAME` by default, which is the container id)

So, if you start the container with `docker run -e JOLOKIA_OFF ...` no agent will be launched.

The following versions are used:

* Java Version: **OpenJDK 1.8.0_40 (1.8.0_40-internal-b04)** (base image: *java:6b32*)
* Jolokia Version: **1.2.2** 
* Jolokia Port: **8778**
