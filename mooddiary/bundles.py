from flask.ext.assets import Bundle


js = Bundle(
    'bower_components/jquery/dist/jquery.js',
    'bower_components/angular/angular.js',
    'bower_components/angular-animate/angular-animate.js',
    'bower_components/angular-ui-router/release/angular-ui-router.js',
    'bower_components/angular-grecaptcha/grecaptcha.js',
    'bower_components/underscore/underscore.js',
    'bower_components/angular-strap/dist/angular-strap.js',
    'bower_components/angular-strap/dist/angular-strap.tpl.js',
    'bower_components/Chart.js/Chart.js',
    'bower_components/angular-chart.js/dist/angular-chart.js',
    'bower_components/bootstrap/js/alert.js',
    'bower_components/bootstrap/js/modal.js',

    'js/utils.js',
    'js/app.js',

    output='gen/app.js',
    filters='rjsmin'
)

css = Bundle(
    'css/styles.less',

    'bower_components/angular-chart.js/dist/angular-chart.css',
    'bower_components/fontawesome/css/font-awesome.min.css',

    output='gen/styles.css',
    filters='less,cssmin'
)
