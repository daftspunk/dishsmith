/*
 * File upload form field control
 *
 * Data attributes:
 * - data-control="fileupload" - enables the file upload plugin
 * - data-upload-link="a.link" - reference to a trigger to open the file browser window
 * - data-upload-input="input" - a file typed html input, this input name will determine the postback variable
 * - data-loading-class="loading" - this class is added to the container when file is uploading
 * - data-progress-bar=".bar" - reference to a progress bar, it's width is modified when file is uploading
 * - data-unique-id="XXX" - an optional identifier for multiple uploaders on the same page, this value will 
 *   appear in the postback variable called X_OCTOBER_FILEUPLOAD
 * - data-refresh-link="a.link" - this link will be triggered when the upload process is successful. useful for 
 *   refreshing an ajax panel.
 *
 * JavaScript API:
 * $('div').fileUploader()
 *
 * Dependancies:
 * - blueimp File Upload (blueimp/jQuery-File-Upload)
 */
+function ($) { "use strict";

    // FILEUPLOAD CLASS DEFINITION
    // ============================

    var FileUpload = function(element, options) {
        this.options   = options
        this.$el       = $(element)
        this.editor    = null
        this.dataCache = null
        this.locked    = false
        var self = this

        /*
         * Validate requirements
         */
        this.inputField = $(this.options.uploadInput)

        if (this.options.uniqueId)
            this.options.extraData['X_OCTOBER_FILEUPLOAD'] = this.options.uniqueId;

        /*
         * Build uploader options
         */
        var uploaderOptions = {
            start: $.proxy(self.onUploadStart, self),
            done: $.proxy(self.onUploadComplete, self),
            progressall: $.proxy(self.onUploadProgress, self),
            fail: $.proxy(self.onUploadFail, self),
            dataType: 'text',
            type: 'POST',
            url: this.options.url,
            paramName: this.inputField.attr('name')
        }

        /*
         * Splice in extraData with any form data
         */
        if (this.options.extraData) {
            uploaderOptions.formData = function(form) {
                if (self.dataCache)
                    return self.dataCache

                var data = form.serializeArray()
                $.each(self.options.extraData, function (name, value) {
                    data.push({name: name, value: value})
                })

                return self.dataCache = data
            }
        }

        /*
         * Bind uploader
         */
        this.inputField.fileupload(uploaderOptions)

        /*
         * Set up the progress bar
         */
        this.progressBar = $(this.options.progressBar).find('>.progress-bar')

        /*
         * Find and bind trigger
         */
        this.$el.on('click', this.options.uploadLink, function(){
            if (self.locked)
                return

            self.inputField.trigger('click')
        })

        /*
         * Bind remove link
         */
        this.$el.on('click', this.options.removeLink, function(){
            self.toggleLoading(true, $(this).closest('.attachment-item'))
        })

        /*
         * If the uploader has attachments, it might have a loading class
         * so wait until the attachments have loaded then remove it.
         */
        if (this.$el.hasClass('has-attachments')) {
            this.$el.find('.attachment-image').each(function(){
                var imgObj = $(this);
                assetManager.load({ img: [imgObj.attr('src')] }, function(){
                    self.toggleLoading(false, imgObj.closest('.attachment-item'))
                })
            })
        }

        /*
         * Sortable items
         */
        if (this.$el.hasClass('is-sortable')) {
            var placeholderEl = $('<li class="placeholder"/>').css({
                    width: this.options.imageWidth,
                    height: this.options.imageHeight
                })

            this.$el.find('ul, ol').sortable({
                itemSelector: 'li:not(.attachment-uploader)',
                placeholder: placeholderEl,
                onDrop: function ($item, container, _super) {
                    _super($item, container)
                    self.onSortAttachments()
                },
                distance: 10
            })
        }

        /*
         * Set heights of items
         */
        this.$el.find('.attachment-item').css({
            width: this.options.imageWidth,
            height: this.options.imageHeight
        })
    }

    FileUpload.prototype.onSortAttachments = function() {
        if (this.options.sortHandler) {

            /*
             * Build an object of ID:ORDER
             */
            var orderData = {}

            this.$el.find('.attachment-item:not(.attachment-uploader)')
                .each(function(index){
                    var id = $(this).data('attachment-id')
                    orderData[id] = index + 1
                })

            this.$el.request(this.options.sortHandler, {
                data: { sortOrder: orderData }
            })
        }
    }

    FileUpload.prototype.onUploadStart = function(event, data) {
        this.locked = true
        this.toggleLoading(true, this.progressBar.closest('.attachment-item'))

        this.options.onStart && this.options.onStart()
    }

    FileUpload.prototype.onUploadComplete = function(event, data) {

        if (data.result !== 'success')
            this.onUploadFail(event, $.extend(data, { errorThrown: data.result }))

        $('#layout-header').addClass('loading')

        // @todo Hacky
        $('#formDishPreview').request('onModifyDish', {
            update: { 'dishes/preview':'#partialDishesPreview' }
        })

        $(window).one('ajaxUpdateComplete', function() {
            $('#layout-header').removeClass('loading')
        })

        this.options.onComplete && this.options.onComplete()

        if (this.options.refreshHandler)
            this.$el.request(this.options.refreshHandler)
    }

    FileUpload.prototype.onUploadFail = function(event, data) {
        alert('Error uploading file: ' + data.errorThrown)
        
        this.options.onFail && this.options.onFail()

        if (this.options.refreshHandler)
            this.$el.request(this.options.refreshHandler)
    }

    FileUpload.prototype.onUploadProgress = function(event, data) {
        var progress = parseInt(data.loaded / data.total * 100, 10)
        this.progressBar.css('width', progress + '%')
    }

    FileUpload.prototype.toggleLoading = function(isLoading, el) {
        var self = this

        if (!this.options.loadingClass)
            return

        if (!el)
            el = this.$el

        if (isLoading) {
            el.addClass(this.options.loadingClass)
        } else {
            el.removeClass(this.options.loadingClass)
        }

        this.progressBar.css('width', '0')
    }

    FileUpload.DEFAULTS = {
        url: null,
        uniqueId: null,
        extraData: {},
        refreshHandler: null,
        sortHandler: null,
        uploadInput: null,
        loadingClass: 'loading',
        removeLink: '.uploader-remove',
        uploadLink: '.uploader-link',
        progressBar: '.uploader-progress',
        onComplete: null,
        onStart: null,
        onFail: null,
        imageWidth: 100,
        imageHeight: 100
    }


    // FILEUPLOAD PLUGIN DEFINITION
    // ============================

    var old = $.fn.fileUploader

    $.fn.fileUploader = function (option) {
        return this.each(function () {
            var $this   = $(this)
            var data    = $this.data('oc.fileUpload')
            var options = $.extend({}, FileUpload.DEFAULTS, $this.data(), typeof option == 'object' && option)
            if (!data) $this.data('oc.fileUpload', (data = new FileUpload(this, options)))
            if (typeof option == 'string') data[option].call($this)
        })
    }

    $.fn.fileUploader.Constructor = FileUpload

    // FILEUPLOAD NO CONFLICT
    // =================

    $.fn.fileUploader.noConflict = function () {
        $.fn.fileUpload = old
        return this
    }

    // FILEUPLOAD DATA-API
    // ===============
    $(document).ready(function () {
        $(document).render(function () {
            $('[data-control="fileupload"]').fileUploader()
        })
    })

}(window.jQuery);

