FROM ruby:3.1.2-alpine

RUN apk update && apk upgrade
RUN apk add --update --no-cache \
      binutils-gold \
      build-base \
      curl \
      file \
      g++ \
      gcc \
      git \
      less \
      libstdc++ \
      libffi-dev \
      libc-dev \
      linux-headers \
      libxml2-dev \
      libxslt-dev \
      libgcrypt-dev \
      make \
      netcat-openbsd \
      nodejs \
      openssl \
      pkgconfig \
      postgresql-dev \
      python3 \
      tzdata \
      yarn \
      sqlite \
      sqlite-dev

ENV BUNDLER_VERSION=2.3.7
RUN gem install bundler -v 2.3.7

WORKDIR /app

COPY Gemfile Gemfile.lock ./

RUN bundle config build.nokogiri --use-system-libraries
RUN bundle check || bundle install

COPY . ./

ENTRYPOINT ["./entrypoints/docker-entrypoint.sh"]
