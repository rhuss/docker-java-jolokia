FROM {{= it.config.java }}

MAINTAINER {{= it.maintainer }}

ENV JOLOKIA_VERSION {{= it.jolokiaVersion }}

# Add environment setup script

ADD jolokia /jolokia

RUN chmod 755 /jolokia && mkdir /opt/jolokia && wget {{= it.jolokiaBaseUrl}}/{{= it.jolokiaVersion}}/jolokia-jvm-{{= it.jolokiaVersion}}-agent.jar -O /opt/jolokia/jolokia.jar

# Default is printing out the version
CMD java -jar /opt/jolokia/jolokia.jar --version
