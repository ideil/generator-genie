//# Laravel Mix
//
//*

/* globals path */
/* eslint
    no-underscore-dangle: [ "error", { "allow": [ __ ] } ],
    one-var: 0,
*/

require('laravel-mix-purgecss');
require('laravel-mix-twig');
require('./webpack/mix-copy-recursively');

const
    mix = require('laravel-mix'),
    IS_PUB = mix.inProduction(),
    IS_BUILD = process.env.MIX_IS_BUILD === 'true',
    MERGE_NON_ADJACENT_CSS_RULES = true,

    glob = require('glob'),
    del = require('del'),
    fse = require('fs-extra'),

    Purgecss = require('purgecss'),
    purgeWhitelist = [
        /focus-visible/,
        // /^regExp&/,
    ],
    //** https://github.com/Klathmon/imagemin-webpack-plugin#readme
    Imagemin = require('imagemin-webpack-plugin').default,

    __ = require('./webpack/paths'),
    Config = require('./webpack/config'),

    wpConfig = {
        // externals: {
        //     jquery: 'jQuery', //** `import $ from 'jquery';`
        //     three: 'three',
        // },

        resolve: {
            alias: {
                '@js': path.resolve(__dirname, __.jsSrc),
                '@plugin': path.resolve(__dirname, __.jsSrc, '_plugins'),
                '@util': path.resolve(__dirname, __.jsSrc, '_utils'),
                '@vendor': path.resolve(__dirname, __.jsSrc, '_vendor'),
            },
        },

        plugins: [
            new Imagemin({
                disable: !IS_PUB,
                cacheFolder: './.cache',
                externalImages: {
                    sources: glob.sync(path.join(__.imgSrc, '!(css)/**/*.{jp?(e|)g,png,gif,webp,svg}')),
                },
                // svgo: { //** html img svg
                //     plugins: [
                //         {
                //             removeViewBox: false,
                //         },
                //     ],
                // },
            }),
            new Imagemin({
                disable: !IS_PUB,
                cacheFolder: './.cache',
                externalImages: {
                    sources: glob.sync(path.join(__.imgSrc, 'css/**/*.{jp?(e|)g,png,gif,webp,svg}')),
                },
                svgo: { //** css svg
                    plugins: [
                        {
                            removeViewBox: false,
                        },
                        {
                            removeDimensions: true,
                        },
                        {
                            // RM fill rule
                            // https://github.com/svg/svgo/issues/1211
                            removeAttrs: {
                                attrs: '(fill|stroke|fill-rule|clip-rule)',
                            },
                        },
                    ],
                },
            }),
        ],
    },

    mixConfig = {
        processCssUrls: IS_PUB,

        fileLoaderDirs: {
            images: __.imgPub,
            fonts: __.fontsPub,
        },

        postCss: [
            // require('postcss-preset-env')({ stage: 2 }),
            require('postcss-inline-svg'), //** optimized by Mix
            require('postcss-focus-visible')({
                preserve: false,
            }),
        ],

        autoprefixer: {
            options: {
                overrideBrowserslist: Config.browserslist,
            },
        },
    };

mix
    .webpackConfig(wpConfig)
    .options(mixConfig)
    .setPublicPath('./')
    .sourceMaps(!IS_PUB || !IS_BUILD ? false : true, 'inline-source-map')
    .disableSuccessNotifications();


//## JS
//
//*

// const
//     JS = glob.sync(path.join(__.RScripts, 'entries/*.js')),
//     DevJS = glob.sync(path.join(__.RScripts, 'develop/*.js'));

mix.js(
    path.join('node_modules', 'focus-visible', 'dist/focus-visible.js'),
    path.join(__.jsPub, 'polyfills')
);

glob.sync(path.join(__.jsSrc, 'entries/!(_)*.js')).forEach(file => {
    mix.js(file, __.jsPub);
});

glob.sync(path.join(__.jsSrc, 'develop/!(_)*.js')).forEach(file => {
    mix.js(file, path.join(__.jsPub, 'develop'));
});


//## SASS
//
//*

const
    scssRoot = __.sass,
    ScssEntries =
        IS_PUB ?
            glob.sync(path.join(__.sass, '**/!(_)*.scss')) :
            glob.sync(path.join(__.sass, '**/!(_|united)*.scss')),
    scssOutput = IS_PUB ? __.cssPub : __.cssSrc;

ScssEntries.forEach(file => {
    const
        subFolder = path.parse(file).dir.replace(scssRoot, '');

    mix
        .sass(file, scssOutput + subFolder, {
            prependData: `$MIX_IS_PUB: ${IS_PUB};`,
        });
});


//## Twig
//
//*

//** Inline CSS and prepare for AMP
// class HtmlInlineCSS {
//     constructor(config) {
//         //* config
//         const
//             CONFIG_DEF = {
//                 commentAttribute: 'HtmlInlineCSS',
//                 htmlPaths: '',
//                 isPurged: false,
//             },
//             CONFIG_USR = config;

//         this.config = Object.assign({}, CONFIG_DEF, CONFIG_USR);

//         this.regPrefix =
//             '<!--\?\(|\\s\*\)' +
//             this.config.commentAttribute +
//             '={';
//         this.regSufix =
//             '}\?\(|\\s\*\)-->';
//         this.regStr = this.regPrefix + '[\\s\\S]*?' + this.regSufix;

//         this.burn();
//     }

//     toRegTemplate(string) {
//         return string.replace(/[-[\]{}()*+?.,\\^$|]/g, '\\$&');
//     }

//     burn() {
//         if (!this.config.htmlPaths) return;

//         glob.sync(this.config.htmlPaths).forEach(htmlPath => {
//             fse.readFile(htmlPath, 'utf8', (err, htmlFile) => {
//                 const
//                     targets = htmlFile.match(new RegExp(this.regStr, 'gm'));

//                 let
//                     targetsLimit = targets.length,
//                     targetsInlined = 0,
//                     htmlOutput;

//                 if (!targetsLimit) return;

//                 targets.forEach(target => {
//                     const
//                         targetConfig =
//                             JSON.parse(
//                                 target.match(
//                                     new RegExp(/{[\s\S]*?}/, 'gm')
//                                 )[0]
//                             ),
//                         cssPath =
//                             path.join(
//                                 path.dirname(htmlPath),
//                                 targetConfig.href
//                             ),
//                         cssIndex = htmlFile.search(this.toRegTemplate(target)) + target.length,
//                         htmlChunks = [htmlFile.slice(0, cssIndex), htmlFile.slice(cssIndex)];

//                     let
//                         styleAttributes = '';

//                     if (targetConfig.attributes.length) {
//                         targetConfig.attributes.forEach((attribute, index) => {
//                             styleAttributes += ` ${attribute}`;
//                         });
//                     }

//                     fse.readFile(cssPath, 'utf8', (err, cssFile) => {
//                         if (err) {
//                             targetsLimit -= 1;

//                             return;
//                         }

//                         const
//                             cssFileOld = htmlChunks[1].match(/^(|\s*)<style[\s\S]*<\/style>/, 'gm'),
//                             htmlEnd = cssFileOld ? htmlChunks[1].replace(cssFileOld[0], '') : htmlChunks[1],
//                             cssFileInline =
//                                 this.config.isPurged ?
//                                     new Purgecss({
//                                         content: [{
//                                             raw: htmlFile,
//                                             extension: 'html',
//                                         }],
//                                         css: [
//                                             cssPath,
//                                         ],
//                                         // whitelistPatterns: {/^class/,}, //* for every page
//                                     }).purge()[0].css :
//                                     cssFile;

//                         htmlOutput =
//                             htmlChunks[0] +
//                             `<style${ styleAttributes }>${ cssFileInline.replace(/(|\s*)!important/g, '').replace(/@charset "UTF-8";/g, '') }</style>` +
//                             htmlEnd;

//                         targetsInlined += 1;

//                         if (targetsLimit === targetsInlined) {
//                             fse.writeFileSync(htmlPath, htmlOutput);
//                         }
//                     });
//                 });
//             });
//         });
//     }
// }

mix
    .twig({
        root: __.twig,
        entries: IS_PUB ? ['**/!(_|index)*.twig'] : ['**/!(_)*.twig'],
        data: IS_BUILD ?
            '_data/**/!(dev|pub)*.{y?(a|)ml,json}' :
            IS_PUB ?
                '_data/**/!(dev|ci)*.{y?(a|)ml,json}' :
                '_data/**/!(pub|ci)*.{y?(a|)ml,json}',
        output: IS_PUB ? path.join(__.html, 'production') : __.html,
        flatten: IS_PUB,
        replaceOutputPath: IS_PUB ? '' : '_',
        dataExtend: {
            ENV_IS_PUB: IS_PUB || IS_BUILD,
        },
        loader: {
            namespaces: {
                'zzz': path.join(__.src, 'zzz'),
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
    })
    /*.then(() => {
        new HtmlInlineCSS({
            isPurged: IS_PUB,
            htmlPaths:
                IS_PUB ?
                    path.join(__.html, 'production/amp-*.html') :
                    path.join(__.html, 'amp/*.html'),
        });
    })*/;


//## BSync
//
//*

mix
    .browserSync({
        proxy: false,

        server: {
            baseDir: __.root,
            directory: true,
        },

        files: [
            //* base: node_modules/laravel-mix/src/components/Browsersync.js
            'app/**/*.php',
            'resources/views/**/*.php',
            //* ideil.
            path.join(__.pub, '**/*.js'),
            path.join(__.cssSrc, '**/*.css'),
            path.join(__.html, '**/*.html'),
        ],
    });


if (IS_PUB) {
    //## Public

    del.sync([
        path.join(__.html, 'production/*.html'),
        path.join(__.html, 'critical'),
        path.join(__.pub, '*'),
    ]);

    mix
        .js(
            [
                path.join(__.jsSrc, '_vendor/cssrelpreload.js'),
            ],
            path.join(__.jsPub, 'vendor/preload.js')
        )
        .copyR({
            input: path.join(__.imgSrc, 'html'),
            pattern: '**/*.{jp?(e|)g,png,gif,webp,svg}',
            output: __.imgPub,
        })
        .purgeCss({
            folders: [
                __.twig,
                __.jsSrc,
            ],
            extensions: [
                'twig',
                'js',
            ],
            whitelistPatterns: purgeWhitelist,
        }).then(stats => {
            if (!MERGE_NON_ADJACENT_CSS_RULES && !IS_PUB) return;
            //** Enabling ability of using DEPRECATRED postcss-merge-rules
            //*  with clean-css[https://github.com/jakubpawlowicz/clean-css]
            //*  unfortunetly it is possible for all of selectors (tags and other)
            //*  but needed only for tags.
            //** Use w/ caution!

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

            //** INLINE CRITICAL CSS
            const
                Critical = {
                    path: path.join(__.cssPub, 'critical'),
                    css: '<!-- critical: css -->',
                    cutStart: '<!-- critical: cutStart -->',
                    cutEnd: '<!-- critical: cutEnd -->',
                },
                collectChunks = (file, start, end) => {
                    let result = '';

                    file.split(start).forEach(chunkStart => {
                        const
                            Chunks = chunkStart.split(end);

                        result += Chunks.length === 1 ? Chunks[0] : Chunks[1];
                    });

                    return result;
                };

            // static/pub/**css**/critical
            fse.mkdir(Critical.path);
            // static/**html**/critical
            fse.mkdir(path.join(__.html, 'critical'));

            glob.sync(path.join(__.html, 'production/**/*.html')).forEach(filePath => {
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
                                path.join(__.cssPub, 'united.css'),
                            ],
                            // whitelistPatterns: {}, //* for every page
                        }).purge();

                    fse.writeFileSync(
                        path.join(__.html, 'critical', fileName),
                        criticalHtml.replace(
                            Critical.css,
                            `<style>/* include: ${path.join(__.cssPub, fileName)} */${purgeCss[0].css}</style>`
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
        // path.join(__.html, 'amp/**/*.html'), //* HtmlInlineCSS
        path.join(__.html, 'customs/**/*.html'),
        path.join(__.html, 'pages/**/*.html'),

        path.join(__.cssSrc, '**/*.css*'),
    ]);
}
