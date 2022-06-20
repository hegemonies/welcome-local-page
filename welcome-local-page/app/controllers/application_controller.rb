require 'yaml'
require 'logger'

class ApplicationController < ActionController::Base
    @@logger = Logger.new(STDOUT)

    def index
        filename = 'wlp-config.yml'
        @@logger.info filename + " is exists " + (File.exists?(filename) ? "true" : "false")

        data = YAML.safe_load(File.open('wlp-config.yml'))
        @@logger.info data

        @welcome_text = data['welcome-text']
        @local_resources = data['resources']
        @@logger.info @local_resources
    end
end
