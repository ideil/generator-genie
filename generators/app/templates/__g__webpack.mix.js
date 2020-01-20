//# Laravel Mix
//
//*

/* globals path */
/* eslint no-underscore-dangle: [ "error", { "allow": [ __ ] } ] */

require('laravel-mix-purgecss');
require('laravel-mix-twig');
require('./build/mix-copy-recursively');

const
    mix = require('laravel-mix'),
    IS_PUB = mix.inProduction(),
    IS_GULP = process.env.MIX_N_GULP === 'true',
    IS_BUILD = process.env.MIX_IS_BUILD === 'true',
    MERGE_NON_ADJACENT_CSS_RULES = true,

    glob = require('glob'),
    del = require('del'),
    fse = require('fs-extra'),

    Purgecss = require('purgecss'),
    //** https://github.com/Klathmon/imagemin-webpack-plugin#readme
    Imagemin = require('imagemin-webpack-plugin').default,

    __ = require('./build/paths'),
    Config = require('./build/config'),

    wpConfig = {
        // externals: {
        //     jquery: 'jQuery', //** `import $ from 'jquery';` in your script
        //     three: 'three',
        // },

        resolve: {
            alias: {
                '@js': path.resolve(__dirname, __.RScripts),
                '@plugin': path.resolve(__dirname, __.RScripts, '_plugins'),
                '@vendor': path.resolve(__dirname, __.RScripts, '_vendor'),
            },
        },

        plugins: [
            new Imagemin({ //** runs before Mix tasks
                disable: !IS_PUB,
                cacheFolder: './.cache',
                externalImages: {
                    sources: glob.sync(path.join(__.RImagesP, '**/*.{jp?(e|)g,png,gif,webp,svg}')),
                },
            }),
        ],
    },

    mixConfig = {
        processCssUrls: IS_PUB,

        fileLoaderDirs: {
            images: __.MImages,
            // images: '../',
            // images: 'pub/img',
            // fonts: 'fonts',
        },

        // postCss: [require('postcss-preset-env')({ stage: 2 })],

        autoprefixer: {
            options: {
                overrideBrowserslist: Config.browserslist,
            },
        },
    };

mix
    .webpackConfig(wpConfig)
    .options(mixConfig)
    .setPublicPath(__.Root)
    .sourceMaps(!IS_PUB || !IS_BUILD, 'inline-source-map')
    .disableSuccessNotifications();


//## JS
//
//*

// const
//     JS = glob.sync(path.join(__.RScripts, 'entries/*.js')),
//     DevJS = glob.sync(path.join(__.RScripts, 'develop/*.js'));

glob.sync(path.join(__.RScripts, 'entries/*.js')).forEach(file => {
    mix.js(file, __.MScripts);
});

glob.sync(path.join(__.RScripts, 'develop/*.js')).forEach(file => {
    mix.js(file, path.join(__.MScripts, 'develop'));
});


//## SASS
//
//*

if (!IS_GULP) {
    const
        scssRoot = __.RSass,
        ScssEntries =
            IS_PUB ?
                glob.sync(path.join(__.RSass, '**/!(_)*.scss')) :
                glob.sync(path.join(__.RSass, '**/!(_|united)*.scss')),
        scssOutput = IS_PUB ? __.MStylesP : __.MStylesD;

    ScssEntries.forEach(file => {
        const
            subFolder = path.parse(file).dir.replace(scssRoot, '');

        mix.sass(file, scssOutput + subFolder, {
            prependData: `$MIX_IS_PUB: ${IS_PUB};`,
        });
    });
}


//## Twig
//
//*

mix
    .twig({
        root: IS_PUB ? path.join(__.RTwig, 'pages') : __.RTwig,
        entries: IS_PUB ? ['**/!(_|index)*.twig'] : ['**/!(_)*.twig'],
        data: IS_BUILD ?
            '_data/**/!(dev|pub)*.{y?(a|)ml,json}' :
            IS_PUB ?
                '../_data/**/!(dev|ci)*.{y?(a|)ml,json}' :
                '_data/**/!(pub|ci)*.{y?(a|)ml,json}',
        output: IS_PUB ? 'html/production' : 'html',
        flatten: IS_PUB,
        dataExtend: {
            ENV_IS_PUB: IS_PUB || IS_BUILD,
        },
        loader: {
            namespaces: {
                'zzz': path.join(__.RSource, 'zzz'),
            },
        },
        html: {
            inject: false,
            minify: false,
        },
        beautify: IS_PUB || IS_BUILD ?
            {
                'end_with_newline': true,
                'indent_inner_html': true,
                'preserve_newlines': false,
            } :
            false,
    });


//## BSync
//
//*

mix
    .browserSync({
        proxy: false,

        server: {
            baseDir: __.Root,
            directory: true,
        },

        files: [
            //* base: node_modules/laravel-mix/src/components/Browsersync.js
            'app/**/*.php',
            'resources/views/**/*.php',
            //* ideil.
            path.join(__.RProduction, '**/*.js'),
            path.join(__.RStylesD, '**/*.css'),
            path.join(__.RHtml, '**/*.html'),
        ],
    });


if (IS_PUB) {
    //## Public

    del.sync([
        path.join(__.RHtml, 'production/*.html'),
        path.join(__.RHtml, 'critical'),
        path.join(__.RProduction, '*'),
    ]);

    mix
        .js(
            [
                path.join(__.RScripts, '_vendor/cssrelpreload.js'),
            ],
            path.join(__.MScripts, 'vendor/preload.js')
        )
        .copyR({
            input: path.join(__.RImagesP, '_html'),
            pattern: '**/*.{jp?(e|)g,png,gif,webp,svg}',
            output: __.RImagesD,
        })
        .purgeCss({
            folders: [
                __.RTwig,
            ],
            extensions: ['twig'],
            whitelistPatterns: [
                /^t-color-dark/,
                /^c-section-dark/,
                /^a-/,
                /iframe/,
            ],
        }).then(stats => {
            if (!MERGE_NON_ADJACENT_CSS_RULES && !IS_PUB) return;
            //** Enabling ability of using DEPRECATRED postcss-merge-rules
            //*  with clean-css[https://github.com/jakubpawlowicz/clean-css]
            //*  unfortunetly it is possible for all of selectors (tags and other)
            //*  but needed only for tags.
            //** Use w/ caution

            const
                UglifyCss = require('clean-css');

            Object.keys(stats.compilation.assets).forEach(file => {
                if (!file.endsWith('.css')) return;

                const
                    cssPath = stats.compilation.assets[file].existsAt,
                    body =
                        new UglifyCss(
                            {
                                level: 2,
                            }
                        ).minify(
                            fse.readFileSync(cssPath, 'utf8')
                        ).styles;

                fse.writeFileSync(cssPath, body);
            });
        }).then(() => {
            if (!IS_PUB) return;

            const
                Critical = {
                    path: path.join(__.RStylesP, 'critical'),
                    css: '<!-- critical: css -->',
                    cutStart: '<!-- critical: cutStart -->',
                    cutEnd: '<!-- critical: cutEnd -->',
                };

            function collectChunks(file, start, end) {
                let result = '';

                file.split(start).forEach(chunkStart => {
                    const
                        Chunks = chunkStart.split(end);

                    result += Chunks.length === 1 ? Chunks[0] : Chunks[1];
                });

                return result;
            }

            // static/pub/**css**/critical
            fse.mkdir(Critical.path);
            // static/**html**/critical
            fse.mkdir(path.join(__.RHtml, 'critical'));

            glob.sync(path.join(__.RHtml, 'production/**/*.html')).forEach(filePath => {
                fse.readFile(filePath, 'utf8', (err, html) => {
                    const
                        isCritical = html.indexOf(Critical.css) > 0;

                    let fileName, criticalHtml, purgeCss;

                    if (!isCritical) return;

                    fileName = path.basename(filePath);

                    criticalHtml = html.indexOf(Critical.cutStart) ?
                        collectChunks(html, Critical.cutStart, Critical.cutEnd) :
                        html;

                    purgeCss =
                        new Purgecss({
                            content: [{
                                raw: criticalHtml,
                                extension: 'html',
                            }],
                            css: [
                                path.join(__.RStylesP, 'united.css'),
                            ],
                        }).purge();

                    fse.writeFileSync(
                        path.join(__.RHtml, 'critical', fileName),
                        criticalHtml.replace(
                            Critical.css,
                            `<style>/* include: ${path.join(__.MStylesP, fileName)} */${purgeCss[0].css}</style>`
                        )
                    );

                    fse.writeFileSync(
                        path.join(Critical.path, fileName.replace(path.extname(fileName), '.css')),
                        purgeCss[0].css
                    );
                });
            });
        })
        .version();
} else {
    //## Develop

    del.sync([
        path.join(__.RHtml, 'customs/**/*.html'),
        path.join(__.RHtml, 'pages/**/*.html'),

        path.join(__.RStylesD, '**/*.css*'),
    ]);
}
