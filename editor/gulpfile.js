var gulp = require('gulp')
var addsrc = require('gulp-add-src')
var concat = require('gulp-concat')

gulp.task('watch', function() {
    gulp.watch('src/**/*', ['build'])
})

gulp.task('build', function() {
    gulp.src(['src/templates/**/*', '../non-linear-story.js'])
        .pipe(arrayify())
        .pipe(createVariableFromTemplate())
        .pipe(addsrc.prepend('src/**/*.js'))
        .pipe(concat('script.js'))
        .pipe(gulp.dest('build/'))
})

var through = require('through2')
var gutil = require('gulp-util')
var PluginError = gutil.PluginError

function arrayify() {
    var stream = through.obj(function(file, enc, cb) {
        var lines = '    \'' + file.contents.toString().replace(/\'/g, '\\\'').split(/\r\n|\n/g).join('\',\n    \'') + '\''
        file.contents = Buffer.concat([ new Buffer(lines) ])
        this.push(file)
        cb()
    })

    return stream
}

function createVariableFromTemplate() {

    var stream = through.obj(function(file, enc, cb) {
        var fileName = file.path.split(/\/|\\/g)
        fileName = fileName[fileName.length - 1]
        fileName = fileName.replace(/\'/g, '\\\'')
        var prefix = 'Templates[\'' + fileName + '\'] = [\n'
        file.contents = Buffer.concat([ new Buffer(prefix), file.contents, new Buffer('\n].join(\'\\n\').replace(/(?:\\s*)(\\<%(?!=).*)/g, \'$1\');') ])
        this.push(file)
        cb()
    })

    return stream
}