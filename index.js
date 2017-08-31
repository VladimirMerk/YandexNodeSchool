var Form = function(form, result)
{
    //Method for retrieving the form and result elements passed when the object is created, or by default, if the elements are not found or transferred
    this.getElement = function(name, type, def) //
    {
        var element = $(name);
        if (typeof name !== 'string' || ! element.length || ! element.is(type)) {
            element = $(def);
        }
        if (element) {
            return element;
        } else {
            return false;
        }
    };

    this.validFields = ['fio', 'email', 'phone'];
    this.formData = {};
    this.isReady = true;
    this.formContainer = this.getElement(form, 'form', '#myForm');
    this.resultContainer = this.getElement(result, 'div', '#resultContainer');

    if (! this.formContainer || ! this.resultContainer) {
        this.isReady = false
    } else {
        this.formContainer.submit(this, function(e) //submit event listener
        {
            if (typeof e !== 'undefined') { e.preventDefault(); } // to stop the form from submitting
            e.data.submit();
            return false;
        });
    }

    this.setData = function(data)
    {
        if (this.isReady && data && typeof data === 'object') {
            var form = this.formContainer;
            $.each(this.validFields, function(k, field) // set only valid fields
            {
                if (field in data && typeof data[field] === 'string') {
                    form.find(`input[name=${field}]`).val(data[field]);
                }
            });
        }
    };

    this.getData = function()
    {
        var result = {};
        if (this.isReady) {
            this.formContainer.find('input').not(':input[type=button], :input[type=submit], :input[type=reset]').each(function(k, field) //getting data from any form fields
            {
                result[field.name] = field.value.trim();
            });
        }
        return result;
    };

    this.validate = function()
    {
        result = {isValid: true, errorFields: []};
        if (this.isReady) {
            var data = this.getData();
            $.each(this.validFields, function(k, field)
            {
                if (field in data) {
                    switch (field) { //Total validation of the existence of values
                        case 'fio':
                        case 'email':
                        case 'phone':
                            if (! data[field]) {
                                result.isValid = false;
                                result.errorFields.push(field);
                            }
                            break;
                    }

                    switch (field) {
                        case 'fio': //Validation fio field
                            if ($.inArray(field, result.errorFields) < 0) { //If there are no errors for this field
                                var maxWord = 3;
                                var pattern = new RegExp(`^(?:\\s+[a-zа-я]{2,}){${maxWord}}$`, 'gi'); //Only 3 words in Cyrillic or Latin characters separated by spaces, more than one character
                                if (! ` ${data[field]}`.match(pattern)) {
                                    result.isValid = false;
                                    result.errorFields.push(field);
                                }
                            }
                            break;
                        case 'email': //Validation email field
                            if ($.inArray(field, result.errorFields) < 0) { //If there are no errors for this field
                                var allowedDomains = ['ya.ru', 'yandex.ru', 'yandex.ua', 'yandex.by', 'yandex.kz', 'yandex.com'];
                                var emailPart = data[field].split('@');
                                if (emailPart.length > 1) {
                                    var pattern = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+$/gi; //Validating part of the email before @ as per the html5 specification
                                    if (! emailPart[0].match(pattern)) {
                                        result.isValid = false;
                                        result.errorFields.push(field);
                                    }
                                    if ($.inArray(emailPart[1], allowedDomains) < 0) { //Validating allowed domain
                                        result.isValid = false;
                                        result.errorFields.push(field);
                                    }
                                } else {
                                    result.isValid = false;
                                    result.errorFields.push(field);
                                }
                            }
                            break;
                        case 'phone': //Validation phone field
                            if ($.inArray(field, result.errorFields) < 0) { //If there are no errors for this field
                                var maxSum = 30;
                                var pattern = /\+7\(\d{3}\)\d{3}(?:-\d{2}){2}/g;
                                if (! data[field].match(pattern)) {
                                    result.isValid = false;
                                    result.errorFields.push(field);
                                }
                                var sumPhone = data[field].replace(/\D/g, '').split('').reduce(function(a,b){return parseInt(a)+parseInt(b)}, 0); //Converting a phone string into an array of numbers and summing it by reducie
                                if (sumPhone > maxSum) {
                                    result.isValid = false;
                                    result.errorFields.push(field);
                                }
                            }
                            break;
                    }
                }
            });

        } else {
            result.isValid = false;
        }
        return result;
    };

    this.submit = function()
    {
        if (this.isReady) {
            var form = this.formContainer;
            form.find('input').removeClass('error'); //Clearing fields from errors
            var validate = this.validate();
            if (validate.isValid) {
                form.find('input[type=submit], button').attr('disabled', true); //Disabling buttons
                var action = form.attr('action');
                var result = this.resultContainer;
                result.removeClass('success error progress'); //Cleaning the resulting container from all classes

                var request = function() {
                    $.ajax({
                        url: action,
                        dataType: "json",
                        timeout:5000,
                        success: function(data) {
                            if (data && data.status) {
                                switch (data.status) {
                                    case 'success':
                                        result.addClass(data.status).text('Success');
                                        break;
                                    case 'error':
                                        result.addClass(data.status).text(data.reason ? data.reason : "");
                                        break;
                                    case 'progress':
                                        result.addClass(data.status).text('');
                                        var timeout = 0;
                                        if (data.timeout) {
                                            timeout = parseInt(data.timeout)
                                        }
                                        timeout = timeout ? timeout * 1000 : 3 * 1000; //If timeout fail then set default value
                                        setTimeout(function() {request();}, timeout); //Recalling request
                                        break;
                                    default:
                                        result.addClass('error').text('Response error');
                                        break;
                                }
                            } else {
                                result.addClass('error').text('Response error');
                            }
                            form.find('input[type=submit], button').removeAttr('disabled');
                        },
                        error: function(x, t, m) {
                            result.addClass('error').text(t);
                            form.find('input[type=submit], button').removeAttr('disabled');
                        }
                    });
                }
                request();
            } else {
                $.each(result.errorFields, function(k, field)
                {
                    form.find(`input[name=${field}]`).addClass('error');
                });
            }
        }
    };
};

var myForm = null;
$(document).ready(function(){
    myForm = new Form('#myForm', '#resultContainer');
});
