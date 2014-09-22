/*
 * Copyright NetSuite, Inc. 2014 All rights reserved.
 * The following code is a demo prototype. Due to time constraints of a demo,
 * the code may contain bugs, may not accurately reflect user requirements
 * and may not be the best approach. Actual implementation should not reuse
 * this code without due verification.
 *
 * @Author: Eduardo Souto
 * @Date:   2014-08-11 18:18:38
 * @Last Modified by:   Eduardo Souto
 * @Last Modified time: 2014-09-17 11:43:52
 */


var gulp = require('gulp'),
    fs = require('fs'), // node File System
    gutil = require('gulp-util'), // Log, beep, template, colors, date, etc
    sass = require('gulp-ruby-sass'),
    less = require('gulp-less'),
    sourcemaps = require('gulp-sourcemaps'),
    autoprefixer = require('gulp-autoprefixer'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat-util'),
    notify = require('gulp-notify'),
    runSequence = require('run-sequence'), // Run tasks in sequence
    replace = require('gulp-replace'), // Search and replace stream
    zip = require('gulp-zip'), // Zips the dist directory
    plumber = require('gulp-plumber'), // Prevent pipe breaking caused by errors from gulp plugins
    mustache = require('gulp-mustache'), // Mustache templates
    jst = require('gulp-jst'),
    map = require('map-stream'),
    rev = require('gulp-rev'),
    revAll = require('gulp-rev-all'),
    revReplace = require('gulp-rev-replace'),
    rimraf = require('gulp-rimraf'), // for deleting files and folders
    size = require('gulp-size'),
    argv = require('yargs').argv, // gulp taskName --app shopflow
    es = require('event-stream'),
    browserSync = require('browser-sync'), // Browser Sync
    debug = require('gulp-debug'),
    rename = require('gulp-rename'), // Renames files
    filter = require('gulp-filter'),
    cache = require('gulp-cached'),
    remember = require('gulp-remember'); // Filter files in a vinyl stream

// plugins = require("gulp-load-plugins")({
//     pattern: ['gulp-*', 'gulp.*'],
//     replaceString: /\bgulp[\-.]/
// });

// spritesmith = require('gulp.spritesmith'); // Convert a set of images into a spritesheet and CSS variables
// imagemin = require('gulp-imagemin'),
// revAppend = require('gulp-rev-append'), // ?rev=@@hash -> ?rev=5cadf43edba6a97980d42331f9fffd17
// rjs = require('gulp-requirejs'), //npm install --save-dev gulp-requirejs
// data = require('gulp-data'), // npm install --save-dev gulp-data -- Generate a data object from a variety of sources: json, front-matter, databases, promises, anything... and set it to the file object for other plugins to consume


var app = {
    paths: {
        root: 'SCA_App_14.2',
        css: ['css/**/*'],
        js: ['js/**/*'],
        templates: ['templates/**/*'],
        images: ['siteImg/**/*'],
        dist: ['dist'],
        local: ['local'],
        basename: function (file) {
            return file.path.substr(file.path.lastIndexOf("/") + 1);
        }
    },
    shopflow: {
        folder: "ShopFlow",
        url: "",
        localUrl: "http://localhost:3000/local/ShopFlow"
    },
    checkout: {
        folder: "Checkout",
        url: "",
        localUrl: "http://localhost:3000/local/Checkout"
    },
    myaccount: {
        folder: "MyAccount",
        url: "",
        localUrl: "http://localhost:3000/local/MyAccount"
    },
    /**
     * changeEvent
     */
    changeEvent: function (evt) {
        // console.log('File ' + event.path + ' was ' + event.type + ', running task...');
        var regExp = new RegExp('.*(/' + app.paths.root + ')/');
        gutil.log('File', gutil.colors.cyan(evt.path.replace(regExp, '')), 'was', gutil.colors.magenta(evt.type));
    },
    /**
     * errorLog
     */
    errorLog: function (error) {
        console.error.bind(error);
        notify.onError("Error: <%= error.message %>");
        this.emit("end");
    }
};




/**
 * Sass
 */
gulp.task('sass', function() {
    "use strict";

    var files = [app.paths.local + '/' + app[argv.app].folder + '/' + app.paths.css + '.scss'];

    return gulp.src(files)
        .pipe(cache('sass')) // only pass through changed files
        // sass --style compressed --sourcemap=auto --scss --trace [INPUT] [OUTPUT]
        .pipe(sass({
            'sourcemap=auto': true,
            style: 'compressed',
            scss: true,
            trace: true
        }).on('error', gutil.log))
        .pipe(remember('sass')) // add back all files to the stream
        .pipe(gulp.dest(app.paths.local + '/' + app[argv.app].folder + '/css'))
        .pipe(plumber({errorHandler: app.errorLog}));
    // .on('error', app.errorLog);
});

/**
 * less
 */
gulp.task('less', function () {
    "use strict";

    var files = [app.paths.local + '/' + app[argv.app].folder + '/css/*.less'];

    return gulp.src(files)
        .pipe(cache('less')) // only pass through changed files
        .pipe(sourcemaps.init())
        .pipe(less({
            compress: true,
            trace: true
        }).on('error', gutil.log))
        .pipe(sourcemaps.write('.')) // write source map
        .pipe(remember('less')) // add back all files to the stream
        .pipe(gulp.dest(app.paths.local + '/' + app[argv.app].folder + '/css'))
        .pipe(plumber({errorHandler: app.errorLog}));
});


/**
 * Styles
 */
gulp.task('styles', function(cb) {
    "use strict";

    var files = "";

    fs.createReadStream(app.paths.local + '/' + app[argv.app].folder + '/css/combiner.config')
        .pipe(es.split())
        .pipe(es.mapSync(function (data) {
            return data.split(':');
        }))
        .pipe(es.mapSync(function (data) {
            if (data[0] === 'Input-files') {
                files = data[1].trim().split(' ');
            }
        }))
        .on('end', function () {
            for(var i = 0; i < files.length; i++){
                files[i] = app.paths.local + '/' + app[argv.app].folder + '/css/' + files[i];
            }

            gulp.src(files)
                // return gulp.src(app.paths.local + '/' + app[argv.app].folder + '/' + app.paths.css + '.css')
                .pipe(sourcemaps.init({loadMaps: true})) // init source map
                .pipe(autoprefixer()) // autoprefix css
                .pipe(concat('styles.css'))
                .pipe(sourcemaps.write('.')) // write source map
                .pipe(size())
                .pipe(gulp.dest(app.paths.local + '/' + app[argv.app].folder))
                .pipe(plumber({errorHandler: app.errorLog}))
                .pipe(notify({onLast: true, message: 'Styles task complete'}));
        });

    cb(); // finished task
});


/**
 * Cleans dist directory
 */
gulp.task('clean', function () {
    "use strict";

    var files = app.paths.dist + '/*';

    return gulp.src(files, {read: false})
        .pipe(rimraf());
});

/**
 * Browser Sync
 */
gulp.task('browser-sync', function () {
    "use strict";

    browserSync({
        open: false,
        server: {baseDir: './'},
        watchOptions: {debounceDelay: 1000}
    });
});


/**
 * Scripts ########################################################
 */

gulp.task('scripts', function(cb) {
    "use strict";

    var files = "";

    fs.createReadStream(app.paths.local + '/' + app[argv.app].folder + '/js/combiner.config')
        .pipe(es.split())
        .pipe(es.mapSync(function (data) {
            return data.split(':');
        }))
        .pipe(es.mapSync(function (data) {
            if (data[0] === 'Input-files') {
                files = data[1].trim().split(' ');
            }
        }))
        .on('end', function () {
            for(var i = 0; i < files.length; i++){
                files[i] = app.paths.local + '/' + app[argv.app].folder + '/js/' + files[i];
            }

            gulp.src(files)
                .pipe(sourcemaps.init()) // init source map
                .pipe(concat('Application.js'))
                .pipe(sourcemaps.write('.')) // write source map
                .pipe(gulp.dest(app.paths.local + '/' + app[argv.app].folder + '/js'))
                .pipe(size());
        });

    cb(); // finished task
});


// Images
// gulp.task('images', function() {
//     "use strict";
//
//     var files = app.paths.local + '/' + app.paths.images;
//
//     return gulp.src(files)
//     .pipe(imagemin({
//         optimizationLevel: 3,
//         progressive: true,
//         interlaced: true
//     }))
//     .pipe(gulp.dest(files));
// });


/**
 * Templates ######################################################
 */

function sc_templates() {
    "use strict";

    return map(function(file, cb) {
        file.contents = new Buffer('SC.customTemplates[\'' + app.paths.basename(file) + '\'] = (' + file.contents.toString() + ');');
        cb(null, file);
    });
}

gulp.task('templates2', function () {
    "use strict";

    return gulp.src(app.paths.local + '/' + app[argv.app].folder + '/' + app.paths.templates + '.txt')
        .pipe(cache('templates')) // only pass through changed files
        .pipe(jst())
        .pipe(remember('templates')) // add back all files to the stream
        .pipe(sc_templates())
        .pipe(concat('Templates.js'))
        .pipe(size())
        .pipe(gulp.dest(app.paths.local + '/' + app[argv.app].folder + '/templates'));
});


/**
 * Generates suitecommerce templates compressed file reading combiner.config
 */

gulp.task('templates', function (cb) {
    "use strict";

    var varname = '',
        objResult = {
            macros: []
        };

    fs.createReadStream(app.paths.local + '/' + app[argv.app].folder + '/templates/combiner.config')
        .pipe(es.split())
        .pipe(es.mapSync(function (data) {
            return data.split(':');
        }))
        .pipe(es.mapSync(function (data) {
            if (data[0] === 'Variable-name') {
                varname = data[1].trim();
            }
        }))
        .on('end', function () {
            fs.createReadStream(app.paths.local + '/' + app[argv.app].folder + '/templates/manifest.txt')
                .pipe(es.split())
                .pipe(es.mapSync(function (data) {
                    return data.split(' ');
                }))
                .pipe(es.mapSync(function (data) {
                    if (data[1] !== undefined) {
                        var fileContent = "";
                        if (data[1].indexOf('metataghtml="macro"') !== -1) {
                            fileContent = fs.readFileSync(app.paths.local + '/' + app[argv.app].folder + '/templates/' + data[0].trim()).toString('utf8');
                            objResult.macros.push(fileContent);
                        }
                        if (data[1].indexOf('tmpl') !== -1) {
                            var tmplName = data[1].split('=');
                            fileContent = fs.readFileSync(app.paths.local + '/' + app[argv.app].folder + '/templates/' + data[0].trim()).toString('utf8');
                            objResult[tmplName[1].replace(/"/g, "")] = fileContent;
                        }
                    }
                }))
                .on('end', function () {
                    var buffer = "";
                    buffer = varname + ' = ' + JSON.stringify(objResult, null, 4) + ';';
                    fs.writeFile(app.paths.local + '/' + app[argv.app].folder + '/templates/Templates.js', buffer);
                });
        });

    cb(); // finished task
});


/**
 * Generates index to work locally
 */
gulp.task('index-local', function () {
    "use strict";

    return gulp.src('app/' + app[argv.app].folder + '/index.ssp')
        .pipe(mustache({app_url: app[argv.app].localUrl}))
        .pipe(rename("index_local.ssp"))
        .pipe(gulp.dest(app.paths.dist + '/' + app[argv.app].folder));
});

/**
 * removes customs.js
 */
// gulp.task('removeCustoms', function (cb) {
//     "use strict";

//     var files = app.paths.local + '/' + app[argv.app].folder + '/customs.js';

//     gulp.src(files, {read: false})
//     .pipe(rimraf());

//     cb(); // finished task
// });

/**
 * Generate the customs.js
 */
    // gulp.task('customs', ['templates', 'scripts'], function() {
gulp.task('customs', function() {
    "use strict";

    var files = [
            app.paths.local + '/' + app[argv.app].folder + '/templates/Templates.js',
            app.paths.local + '/' + app[argv.app].folder + '/js/Application.js'
    ];

    return gulp.src(files)
        .pipe(sourcemaps.init({loadMaps: true})) // init source map
        .pipe(concat('customs.js'))
        .pipe(sourcemaps.write('.')) // write source map
        .pipe(size())
        .pipe(gulp.dest(app.paths.local + '/' + app[argv.app].folder))
        .pipe(plumber({errorHandler: app.errorLog}))
        .pipe(notify({onLast: true, message: 'Customs task complete'}));
});


/**
 * Build for local environment
 */
gulp.task('build-local', function () {
    "use strict";

    runSequence(['sass', 'less'], 'styles', ['templates', 'scripts'], 'customs');
});


/**
 * Watch tasks #########################################################
 */

gulp.task('watch-sass', function () {
    "use strict";

    // var files = [app.paths.local + '/' + app[argv.app].folder + '/' + app.paths.css + '.+(scss|less)'];
    var files = [
            app.paths.local + '/' + app[argv.app].folder + '/' + app.paths.css + '.scss',
            app.paths.local + '/' + app[argv.app].folder + '/css/combiner.config'
    ];

    var watcher = gulp.watch(files, ['sass', browserSync.reload]);
    watcher.on('change', function (event) {
        app.changeEvent(event);
        if (event.type === 'deleted') { // if a file is deleted, forget about it
            delete cache.caches['sass'][event.path];
            remember.forget('sass', event.path);
        }
    });
});

gulp.task('watch-less', function () {
    "use strict";

    var files = [
            app.paths.local + '/' + app[argv.app].folder + '/' + app.paths.css + '.less',
            app.paths.local + '/' + app[argv.app].folder + '/css/combiner.config'
    ];

    var watcher = gulp.watch(files, ['less', browserSync.reload]);
    watcher.on('change', function (event) {
        app.changeEvent(event);
        if (event.type === 'deleted') { // if a file is deleted, forget about it
            delete cache.caches['less'][event.path];
            remember.forget('less', event.path);
        }
    });
});

gulp.task('watch-styles', function () {
    "use strict";

    // var files = [app.paths.local + '/' + app[argv.app].folder + '/' + app.paths.css + '.+(scss|less)'];
    var files = [app.paths.local + '/' + app[argv.app].folder + '/' + app.paths.css + '.css'];

    var watcher = gulp.watch(files, ['styles', browserSync.reload]);
    watcher.on('change', function (event) {
        app.changeEvent(event);
    });
});

gulp.task('watch-js', function () {
    "use strict";

    var files = [
            app.paths.local + '/' + app[argv.app].folder + '/' + app.paths.js + '.js',
            app.paths.local + '/' + app[argv.app].folder + '/js/combiner.config',
            '!' + app.paths.local + '/' + app[argv.app].folder + '/js/Application.js'
    ];

    var watcher = gulp.watch(files, ['scripts', browserSync.reload]);
    watcher.on('change', function (event) {
        app.changeEvent(event);
    });
});

gulp.task('watch-templates', function () {
    "use strict";

    var files = [
            app.paths.local + '/' + app[argv.app].folder + '/' + app.paths.templates + '.txt',
            app.paths.local + '/' + app[argv.app].folder + '/templates/combiner.config',
            app.paths.local + '/' + app[argv.app].folder + '/templates/manifest.txt'
    ];

    var watcher = gulp.watch(files, ['templates', browserSync.reload]);
    watcher.on('change', function (event) {
        app.changeEvent(event);
        if (event.type === 'deleted') { // if a file is deleted, forget about it
            delete cache.caches['templates'][event.path];
            remember.forget('templates', event.path);
        }
    });
});

// gulp.task('watch-imgs', function () {
//     "use strict";

// var files = app.paths.local + '/' + app.paths.images;

// var watcher = gulp.watch(files, ['images']);
// watcher.on('change', function (event) {
//     app.changeEvent(event);
// });
// });

gulp.task('watch-customs', function () {
    "use strict";

    var files = [
            app.paths.local + '/' + app[argv.app].folder + '/templates/Templates.js',
            app.paths.local + '/' + app[argv.app].folder + '/js/Application.js'
    ];

    var watcher = gulp.watch(files, ['customs', browserSync.reload]);
    watcher.on('change', function (event) {
        app.changeEvent(event);
    });
});

gulp.task('watch', ["watch-sass", "watch-less", "watch-styles", "watch-js", "watch-templates", "watch-customs"]);

/**
 * BUILD DIST ##################################################
 */


gulp.task('build-index', function () {
    "use strict";

    var files = ['app/' + app[argv.app].folder + '/index.ssp'];

    return gulp.src(files)
        .pipe(mustache({app_url: app[argv.app].url}))
        .pipe(rename("index_cus.ssp"))
        .pipe(gulp.dest(app.paths.dist + '/' + app[argv.app].folder));
});

gulp.task('build-siteImg', function () {
    "use strict";

    var filesToCopy = [app.paths.local + '/' + app[argv.app].folder + '/siteImg/**/*'];

    return gulp.src(filesToCopy)
        .pipe(gulp.dest(app.paths.dist + '/' + app[argv.app].folder + '/siteImg'));
});

gulp.task('build-siteFonts', function () {
    "use strict";

    var filesToCopy = [app.paths.local + '/' + app[argv.app].folder + '/fonts/**/*'];

    return gulp.src(filesToCopy)
        .pipe(gulp.dest(app.paths.dist + '/' + app[argv.app].folder + '/fonts'));
});

gulp.task('build-styles', function () {
    "use strict";

    var files = [app.paths.local + '/' + app[argv.app].folder + "/styles.css"];

    return gulp.src(files)
        // .pipe(replace(app[argv.app].localUrl, app[argv.app].url))
        .pipe(gulp.dest(app.paths.dist + '/' + app[argv.app].folder));
});

gulp.task('build-customs', function () {
    "use strict";

    var files = [app.paths.local + '/' + app[argv.app].folder + "/customs.js"];

    return gulp.src(files)
        .pipe(uglify({mangle: false}))
        .pipe(gulp.dest(app.paths.dist + '/' + app[argv.app].folder));
});

gulp.task('build-revision', function () {
    "use strict";

    var files = [app.paths.dist + '/' + app[argv.app].folder + '/*'],
        ignoreList = ['.ssp', '.json', '.png', '.jpg', '.gif'];

    return gulp.src(files)
        .pipe(revAll({
            ignore: ignoreList,
            separator: '-'
        }))
        .pipe(revReplace({ replaceInExtensions: ['.ssp'] }))
        .pipe(gulp.dest(app.paths.dist + '/' + app[argv.app].folder));
});

gulp.task('build-deleteNonRevisionedFiles', function () {
    "use strict";

    var files = [
            app.paths.dist + '/' + app[argv.app].folder + '/styles.css',
            app.paths.dist + '/' + app[argv.app].folder + '/customs.js'
    ];

    return gulp.src(files, { read: false })
        .pipe(rimraf());
});

gulp.task('build-languages', function () {
    "use strict";

    var filesToCopy = [app.paths.local + '/' + app[argv.app].folder + '/languages/**/*'];

    return gulp.src(filesToCopy)
        .pipe(gulp.dest(app.paths.dist + '/' + app[argv.app].folder + '/languages_cus'));
});

gulp.task('build-zipDist', function () {
    "use strict";

    var files = [
            app.paths.dist + '/' + app[argv.app].folder + '/**/*'
        // '!' + app.paths.dist + '/' + app[argv.app].folder + '/**/*.ssp'
    ];

    return gulp.src(files)
        .pipe(zip('build-' + app[argv.app].folder + '.zip'))
        .pipe(gulp.dest(app.paths.dist + '/'));
});

gulp.task('build-dist', function () {
    "use strict";

    runSequence(
        "clean",
        "build-index",
        ["build-styles","build-customs"],
        "build-revision",
        "build-deleteNonRevisionedFiles",
        "build-languages",
        "build-zipDist"
    );
});

gulp.task('build-dist-all', function () {
    "use strict";

    runSequence(
        "clean",
        "build-index",
        ["build-styles","build-customs"],
        "build-revision",
        "build-deleteNonRevisionedFiles",
        ["build-siteImg", "build-siteFonts"],
        "build-languages",
        "build-zipDist"
    );
});

// /BUILD DIST ##################################################


//Gulp help
gulp.task('help', function () {
    "use strict";
    console.log("\r");
    console.log(gutil.colors.cyan("Available Tasks"));
    console.log("\r");
    console.log(gutil.colors.cyan("gulp index-local --app shopflow") + "  :  generate a new index_local.ssp inside /dist folder for upload and work locally");
    console.log(gutil.colors.cyan("gulp sass --app shopflow") + "  :  compile all .scss files inside --app option-folder inside /css, available options [shopflow, checkout, myaccount]");
    console.log(gutil.colors.cyan("gulp less --app shopflow") + "  :  compile all .less as above");
    console.log(gutil.colors.cyan("gulp styles --app shopflow") + "  :  concatenate all files into /local/styles.css based on combiner.config");
    console.log(gutil.colors.cyan("gulp browser-sync") + "  :  open a web-server under localhost:3000 that point to ./");
    console.log(gutil.colors.cyan("gulp scripts --app shopflow") + "  :  compile all scripts inside /js folder based on combiner.config");
    console.log(gutil.colors.cyan("gulp templates --app shopflow") + "  :  compile all templates inside /templates folder based on combiner.config");
    console.log(gutil.colors.cyan("gulp customs --app shopflow") + "  :  compile all scripts inside /js folder to work locally");
    console.log(gutil.colors.cyan("gulp watch --app shopflow") + "  :  watch all [styles, scripts, templates]");
    console.log(gutil.colors.cyan("gulp build-local --app shopflow") + "  :  build all for local development");
    console.log(gutil.colors.cyan("gulp build-dist --app shopflow") + "  :  build all the necessary files for distribution inside /dist, except /siteImg");
    console.log(gutil.colors.cyan("gulp build-dist-all --app shopflow") + "  :  build all the necessary files for distribution inside /dist including /siteImg");
    console.log(gutil.colors.cyan("gulp clean") + "  :  remove all inside /dist folder");
    console.log("\r");
});




gulp.task('test', function() {
    // var regex = /^.*-[\d\S]{8}/g;
    // return gulp.src('dist/**/*-[a-z0-9][a-z0-9][a-z0-9][a-z0-9][a-z0-9][a-z0-9][a-z0-9][a-z0-9].*', {read: false})
    // return gulp.src('dist/**/*', {read: false})
    // // .pipe(ignore.exclude(['*.ssp', '*-[a-z0-9]{8}']))
    // .pipe(ignore.exclude(['*.ssp']))
    // .pipe(debug());

    // gulp.src(['dist/**/styles.css', 'dist/**/Application.js', 'dist/**/Templates.js']) // global matching
    // .pipe(debug());

    // runSequence(
    //     gulp.src(['dist/**/styles.css', 'dist/**/Application.js', 'dist/**/Templates.js']) // global matching
    //     .pipe(debug()),
    //     gulp.src(['dist/index.ssp'])
    //     .pipe(debug())
    // );
});
