/*
 * Application
 *
 */

/*
 * Bootstrap
 * 
=require modernizr
=require mousewheel
=require dragscroll
=require typeahead
=require sortable
=require ../vendor/bootstrap/js/transition
=require ../vendor/bootstrap/js/alert
=require ../vendor/bootstrap/js/button
=require ../vendor/bootstrap/js/carousel
=require ../vendor/bootstrap/js/collapse
=require ../vendor/bootstrap/js/dropdown
=require ../vendor/bootstrap/js/modal
=require ../vendor/bootstrap/js/tooltip
=require ../vendor/bootstrap/js/popover
=require ../vendor/bootstrap/js/scrollspy
=require ../vendor/bootstrap/js/tab
=require ../vendor/bootstrap/js/affix
=require ../vendor/bootstrap-select/bootstrap-select.js
 */

$(document).tooltip({
    selector: '[data-toggle=tooltip]'
})

$(document).ready(function(){
    $(document).render(function(){
        $('[data-toggle=popover]').popover({
            html: true
        })

        $('.selectpicker').selectpicker({
            container: 'body'
        })
    })
})

$(document)
    .on('ajaxPromise', '[data-request]', function() {
        $('#layout-header').addClass('loading')

        // This code will cover instances where the element has been removed
        // from the DOM, making the resolution event below an orphan.
        var $el = $(this);
        $(window).one('ajaxUpdateComplete', function(){
            if ($el.closest('html').length === 0)
                $('#layout-header').removeClass('loading')
        })

    }).on('ajaxFail ajaxDone', '[data-request]', function(){
        $('#layout-header').removeClass('loading')
    })