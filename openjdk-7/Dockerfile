FROM java:7u65

MAINTAINER roland@jolokia.org

ENV JOLOKIA_VERSION 1.2.2

# Add environment setup script
ADD jolokia_opts /bin/

RUN chmod 755 /bin/jolokia_opts && mkdir /opt/jolokia && wget http://central.maven.org/maven2/org/jolokia/jolokia-jvm/1.2.2/jolokia-jvm-1.2.2-agent.jar -O /opt/jolokia/jolokia.jar

# Print out the version
CMD java -jar /opt/jolokia/jolokia.jar --version
