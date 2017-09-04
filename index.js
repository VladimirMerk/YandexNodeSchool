const Form = function(formArg, resultArg) {
    //Method for retrieving the form and result elements passed when the object is created, 
    //or by default, if the elements are not found or transferred
    this.getElement = function(name, type, defaultId) {
        let element = $(name);
        if (typeof name !== 'string' || ! element.length || ! element.is(type)) {
            element = $(defaultId);
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
    this.formContainer = this.getElement(formArg, 'form', '#myForm');
    this.resultContainer = this.getElement(resultArg, 'div', '#resultContainer');

    if (! this.formContainer || ! this.resultContainer) {
        this.isReady = false
    } else {
        this.formContainer.submit(this, function(event) { //submit event listener
            if (event != null) {
                event.preventDefault(); // to stop the form from submitting
            }
            event.data.submit();
            return false;
        });
    }

    this.setData = function(data) {
        if (this.isReady && data != null && $.isPlainObject(data)) {
            const form = this.formContainer;
            $.each(this.validFields, function(key, field) { // set only valid fields
                if (field in data && typeof data[field] === 'string') {
                    form.find(`input[name=${field}]`).val(data[field]);
                }
            });
        }
    };

    this.getData = function() {
        let result = {};
        if (this.isReady) {
            this.formContainer.find('input')
            .not(':input[type=button], :input[type=submit], :input[type=reset]')
            .each(function(key, field) { //getting data from any form fields
                result[field.name] = field.value.trim();
            });
        }
        return result;
    };

    this.validate = function() {
        let result = {isValid: true, errorFields: []};
        if (this.isReady) {
            const data = this.getData();
            $.each(this.validFields, function(key, field) {
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
                                const maxWord = 3;
                                //Only 3 words in Cyrillic or Latin characters separated by spaces, more than one character
                                let pattern = new RegExp(`^(?:\\s+[a-zа-я]{2,}){${maxWord}}$`, 'gi');
                                if (! ` ${data[field]}`.match(pattern)) {
                                    result.isValid = false;
                                    result.errorFields.push(field);
                                }
                            }
                            break;
                        case 'email': //Validation email field
                            if ($.inArray(field, result.errorFields) < 0) { //If there are no errors for this field
                                const allowedDomains = ['ya.ru', 'yandex.ru', 'yandex.ua', 'yandex.by', 'yandex.kz', 'yandex.com'];
                                const emailPart = data[field].split('@');
                                if (emailPart.length > 1) {
                                    //Validating part of the email before @ as per the html5 specification
                                    let pattern = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+$/gi;
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
                                const maxSum = 30;
                                let pattern = /\+7\(\d{3}\)\d{3}(?:-\d{2}){2}/g;
                                if (! data[field].match(pattern)) {
                                    result.isValid = false;
                                    result.errorFields.push(field);
                                }
                                //Converting a phone string into an array of numbers and summing it by reducie
                                const sumPhone = data[field].replace(/\D/g, '')
                                .split('')
                                .reduce(function(digitA,digitB) {
                                    return parseInt(digitA)+parseInt(digitB);
                                }, 0);
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

    this.submit = function() {
        if (this.isReady) {
            const form = this.formContainer;
            form.find('input').removeClass('error'); //Clearing fields from errors
            const validate = this.validate();
            if (validate.isValid) {
                form.find('input[type=submit], button').attr('disabled', true); //Disabling buttons
                const action = form.attr('action');
                const result = this.resultContainer;
                result.removeClass('success error progress'); //Cleaning the resulting container from all classes
                const request = function() {
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
                                        let timeout = 0;
                                        if (data.timeout) {
                                            timeout = parseInt(data.timeout);
                                        }
                                        timeout = timeout ? timeout * 1000 : 3 * 1000; //If timeout fail then set default value
                                        setTimeout(function() { //Recalling request after timeout
                                            request();
                                        }, timeout);
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
                        error: function(jqXHR, textStatus, errorThrown) {
                            result.addClass('error').text(textStatus);
                            form.find('input[type=submit], button').removeAttr('disabled');
                        }
                    });
                }
                request();
            } else {
                if (validate && validate.errorFields) {
                    $.each(validate.errorFields, function(key, field) {
                        form.find(`input[name=${field}]`).addClass('error');
                    });
                }
            }
        }
    };
};

let myForm = null;
$(document).ready(function() {
    myForm = new Form('#myForm', '#resultContainer');
});
