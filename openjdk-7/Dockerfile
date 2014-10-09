FROM java:7u65

MAINTAINER roland@jolokia.org

ENV JOLOKIA_VERSION 1.2.2

# Add environment setup script

ADD jolokia /jolokia

RUN chmod 755 /jolokia && mkdir /opt/jolokia && wget http://central.maven.org/maven2/org/jolokia/jolokia-jvm/1.2.2/jolokia-jvm-1.2.2-agent.jar -O /opt/jolokia/jolokia.jar

# Default is printing out the version
CMD java -jar /opt/jolokia/jolokia.jar --version
