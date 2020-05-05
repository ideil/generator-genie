/* eslint no-underscore-dangle: [ "error", { "allow": [ __ ] } ] */

'use strict';

const
    Generator = require('yeoman-generator'),
    startCase = require('lodash/startCase'),
    kebabCase = require('lodash/kebabCase');

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);

        this.genie = {
            __: require(this.templatePath('__g__webpack/paths')),

            copyAll: (Files) => {
                Files.forEach(file => {
                    this.fs.copy(
                        this.templatePath(`__g__${file}`),
                        this.destinationPath(file)
                    );
                });
            },
        };
    }

    prompting() {
        const
            prompts = [
                {
                    type: 'input',
                    name: 'name',
                    message: 'Project name',
                    default: kebabCase(this.appname),
                },
                {
                    type: 'input',
                    name: 'description',
                    message: 'Description',
                    default: 'Private web application.',
                },
                {
                    type: 'input',
                    name: 'repository',
                    message: 'Repository',
                    default: 'skip',
                },
                {
                    type: 'input',
                    name: 'author',
                    message: 'Author name',
                    default: 'ideil.',
                },
                {
                    type: 'input',
                    name: 'authorURL',
                    message: 'Author URL',
                    default: 'https://www.ideil.com/',
                },
            ];

        return this.prompt(prompts).then(props => {
            this.props = props;
        });
    }

    configuring() {
        this.genie.copyAll([
            '.editorconfig',
            '.eslintrc',
            '.gitignore',
            '.gitlab-ci.yml',
            '.jshintrc',
            'webpack.mix.js',
        ]);

        this.fs.copyTpl(
            this.templatePath('LICENSE.md'),
            this.destinationPath('LICENSE.md'),
            {
                year: new Date().getFullYear(),
            }
        );
        this.fs.copyTpl(
            this.templatePath('README.md'),
            this.destinationPath('README.md'),
            {
                title: startCase(this.props.name),
                description: this.props.description,
                author: this.props.author,
                authorURL: this.props.authorURL,
            }
        );
    }

    writing() {
        const
            pkgJson = {
                name: kebabCase(this.props.name),
                version: '0.0.0',
                description: this.props.description,
                main: 'webpack.mix.js',
                repository: this.props.repository === 'skip' ? '' :
                    {
                        type: 'git',
                        url: this.props.repository,
                    },
                keywords: [],
                author: {
                    name: this.props.author,
                    url: this.props.authorURL,
                },
                // private: true,
                license: 'MIT',
                scripts: {
                    dev: 'npm run development',
                    development: 'cross-env NODE_ENV=development node_modules/webpack/bin/webpack.js --progress --hide-modules --config=node_modules/laravel-mix/setup/webpack.config.js',
                    watch: 'npm run development -- --watch',
                    hot: 'cross-env NODE_ENV=development node_modules/webpack-dev-server/bin/webpack-dev-server.js --inline --hot --config=node_modules/laravel-mix/setup/webpack.config.js',
                    prod: 'npm run production',
                    production: 'cross-env NODE_ENV=production node_modules/webpack/bin/webpack.js --no-progress --hide-modules --config=node_modules/laravel-mix/setup/webpack.config.js',
                    build: 'MIX_IS_BUILD=true npm run development && npm run production',
                    test: 'echo "Error: no test specified"',
                },
            };

        this.fs.extendJSON(this.destinationPath('package.json'), pkgJson);

        this.genie.copyAll([
            'static',
            'webpack',
        ]);
    }

    install() {
        const
            Packages = [
                'cross-env',
                'eslint-config-crockford',
                'imagemin-webpack-plugin',
                'laravel-mix',
                'laravel-mix-purgecss',
                'laravel-mix-twig',
            ];

        this.npmInstall(Packages, { 'save-dev': true });

        this.npmInstall(['bootstrap']);
    }

    end() {
        const
            bsPath = 'node_modules/bootstrap/scss/',
            bsInitials = ['root', 'reboot', 'type'];

        let
            bsMain = this.fs.read(this.destinationPath(bsPath + 'bootstrap.scss'));

        bsMain = bsMain.replace(/\/\*!/g, '/*');
        bsMain = bsMain.replace(/@import/g, '// @import');
        bsInitials.forEach(entry => {
            bsMain = bsMain.replace(`// @import "${entry}`, `@import "${entry}`);
        });
        bsMain = bsMain.replace(/@import "/g, '@import "~bootstrap/scss/');
        bsMain = bsMain.replace('// @import', '@import "set/a-set";\n// @import');

        this.fs.write(this.destinationPath(this.genie.__.sass + '/bs.scss'), bsMain);

        this.fs.copy(
            this.destinationPath(bsPath + '_variables.scss'),
            this.destinationPath(this.destinationPath(this.genie.__.sass + '/_dump/_bs-vars.scss'))
        );
    }
};
