/* eslint-env jquery */
var WbnDatePicker = function ($input) {
    this.$input = $input
  
    this.init()
  }
  
  WbnDatePicker.prototype.init = function () {
    'use strict'
    // init constants
    this.defaults = this.parseDefaults()
  
    // create wrapper
    this.$input.wrap('<div class="wbn-datepicker-wrapper"></div>')
    this.$wrapper = this.$input.parent('.wbn-datepicker-wrapper')
  
    // create modal
    var $modal = $(
      '<div class="wbn-datepicker-modal" data-name="' +
      this.defaults.name +
      '"></div>'
    )
    $modal.insertAfter(this.$wrapper)
    this.$modal = $modal
  
    // create controls
    var inputWidth = this.$input.outerWidth()
    var inputHeight = this.$input.outerHeight()
    var $controlsHtml = $(this.getControlsHtml())
    $controlsHtml.width(inputWidth)
    $controlsHtml.height(inputHeight)
    this.$wrapper.append($controlsHtml)
    this.$controls = this.$wrapper.find('.wbn-datepicker-controls')
    this.$year = this.$controls.find('.year')
    this.$month = this.$controls.find('.month')
    this.$monthLabel = this.$controls.find('.month-label')
    this.$date = this.$controls.find('.date')
    this.$dayOfWeek = this.$controls.find('.day-of-week')
  
    // hide input
    this.$input.attr('type', 'hidden')
  
    // create envelope
    var $envelope = $('<div class="wbn-datepicker-envelope"></div>')
    this.$wrapper.append($envelope)
    this.$envelope = this.$wrapper.find('.wbn-datepicker-envelope')
  
    // create views-wrapper
    var $wrapper = $('<div class="views-wrapper"></div>')
    this.$envelope.append($wrapper)
    this.$viewsWrapper = this.$envelope.find('.views-wrapper')
  
    // create year, month and date views
    this.$viewsWrapper.append(
      $('<div class="datepicker-view year-view">Year</div>')
    )
    this.$viewsWrapper.append(
      $('<div class="datepicker-view month-view">Month</div>')
    )
    this.$viewsWrapper.append($('<div class="datepicker-view week-view"></div>'))
    this.$yearView = this.$viewsWrapper.find('.year-view')
    this.$monthView = this.$viewsWrapper.find('.month-view')
    this.$weekView = this.$viewsWrapper.find('.week-view')
  
    // draw calendar
    this.drawYearCalendar(this.defaults.date.getFullYear())
    this.drawMonthCalendar(this.defaults.date)
    this.drawWeekCalendar(this.defaults.date)
  
    // bind UI actions
    this.bindUIActions_controls()
    this.bindUIActions_yearView()
    this.bindUIActions_monthView()
    this.bindUIActions_weekView()
  
    // register listeners
    this.registerListeners()
  }
  
  WbnDatePicker.prototype.parseDefaults = function () {
    'use strict'
    var today = new Date()
  
    var targetDateStr = this.$input.val()
    var targetDate = new Date(targetDateStr)
  
    if (isNaN(targetDate.getTime())) {
      targetDate = today
    }
  
    var minYear = targetDate.getFullYear() - 5
    var minMonth = 0
    var minDate = 1
    var maxYear = targetDate.getFullYear() + 1
    var maxMonth = 11
    var maxDate = 31
  
    this.REPEAT_MODE_WEEKLY = 'weekly'
    this.REPEAT_MODE_FORTNIGHTLY = 'fortnightly'
    this.REPEAT_MODE_MONTHLY = 'monthly'
  
    var REPEAT_MODES = [
      this.REPEAT_MODE_WEEKLY,
      this.REPEAT_MODE_FORTNIGHTLY,
      this.REPEAT_MODE_MONTHLY
    ]
  
    var ipMin = this.$input.attr('data-min')
    if (ipMin) {
      var ipMinDate = new Date(ipMin)
  
      if (!isNaN(ipMinDate.getTime())) {
        minYear = ipMinDate.getFullYear()
        minMonth = ipMinDate.getMonth()
        minDate = ipMinDate.getDate()
      }
    }
  
    var ipMax = this.$input.attr('data-max')
    if (ipMax) {
      var ipMaxDate = new Date(ipMax)
  
      if (!isNaN(ipMaxDate.getTime())) {
        maxYear = ipMaxDate.getFullYear()
        maxMonth = ipMaxDate.getMonth()
        maxDate = ipMaxDate.getDate()
      }
    }
  
    var repeat = false
    var repeatMode = this.$input.attr('data-repeat')
    if (repeatMode && REPEAT_MODES.indexOf(repeatMode) !== -1) {
      var repeatDay = parseInt(this.$input.attr('data-repeat-day'))
      if (this.isValidRepeatDay(repeatMode, repeatDay)) {
        repeat = {
          mode: repeatMode,
          day: repeatDay
        }
      }
  
      if (repeatMode === this.REPEAT_MODE_FORTNIGHTLY) {
        var repeatStart = new Date(this.$input.attr('data-repeat-start'))
        if (!isNaN(repeatStart.getTime())) {
          repeat.start = repeatStart
          repeat.day = repeatStart.getDay()
        }
      }
    }
  
    var startSrc = this.$input.attr('data-start-src')
    if (!startSrc) {
      startSrc = false
    }
  
    var name = this.$input.attr('name')

    if (!name) {
        name = this.$input.attr('id')
    }
  
    if (!name) {
      throw new this.ValidationException(
        '#' + this.$input.id(),
        'Missing attribute "name"'
      )
    }
  
    return {
      name: name,
      date: targetDate,
      min: new Date(minYear, minMonth, minDate),
      max: new Date(maxYear, maxMonth, maxDate),
      repeat: repeat,
      startSrc: startSrc
    }
  }
  
  WbnDatePicker.prototype.getControlsHtml = function () {
    'use strict'
    var targetDate = this.defaults.date
    var isValueExplicit = this.$input.val() !== ''
  
    var year = targetDate.getFullYear()
    var month = targetDate.getMonth()
    var monthName = this._getMonthName(month)
    var date = targetDate.getDate()
    var dayName = this._getDayName(targetDate.getDay())
  
    return [
      '<div class="wbn-datepicker-controls">',
      getYearHtml(year, isValueExplicit),
      getMonthLabelHtml(monthName, isValueExplicit),
      getMonthHtml(month, isValueExplicit),
      getDateHtml(date, isValueExplicit),
      getDayLabelHtml(dayName, isValueExplicit),
      '</div>'
    ].join('')
  
    function getYearHtml (year, includeValue) {
      var attrs = [
        'class="year"',
        'placeholder="' + year + '"',
        'pattern="[0-9]{4}"',
        'required'
      ]
  
      if (includeValue) {
        attrs.push('value="' + year + '"')
      }
  
      return '<input type="text" ' + attrs.join(' ') + ' />'
    }
  
    function getMonthLabelHtml (month, includeValue) {
      var attrs = [
        'class="month-label"',
        'placeholder="' + month + '"',
        'pattern="[A-Za-z]{3}"',
        'required'
      ]
  
      if (includeValue) {
        attrs.push('value="' + month + '"')
      }
  
      return '<input type="text" ' + attrs.join(' ') + ' />'
    }
  
    function getMonthHtml (month, includeValue) {
      var attrs = ['class="month"']
  
      if (includeValue) {
        attrs.push('value="' + month + '"')
      }
  
      return '<input type="hidden" ' + attrs.join(' ') + ' />'
    }
  
    function getDateHtml (date, includeValue) {
      var attrs = [
        'class="date"',
        'placeholder="' + date + '"',
        'pattern="[0-9]{1,2}"',
        'required'
      ]
  
      if (includeValue) {
        attrs.push('value="' + date + '"')
      }
  
      return '<input type="text" ' + attrs.join(' ') + ' />'
    }
  
    function getDayLabelHtml (dayName, includeValue) {
      var attrs = [
        'class="day-of-week"',
        'placeholder="' + dayName + '"',
        'pattern="[A-Za-z]{3}"',
        'tabindex="-1"',
        'required',
        'readonly'
      ]
  
      if (includeValue) {
        attrs.push('value="' + dayName + '"')
      }
  
      return '<input type="text" ' + attrs.join(' ') + ' />'
    }
  }
  
  WbnDatePicker.prototype.showCalendar = function (hideFinally, stopAt) {
    'use strict'
    hideFinally = typeof hideFinally === 'undefined' ? true : hideFinally
    stopAt = typeof stopAt === 'undefined' ? 'week' : stopAt
  
    // set defaults when called using $.proxy method
    if (arguments.length <= 1) {
      hideFinally = true
    }
    if (arguments.length <= 2) {
      stopAt = 'week'
    }
  
    var year = this.$year.val()
    var month = this.$month.val()
    var date = this.$date.val()
  
    try {
      this.validateYear()
  
      // update year calendar
      this.drawYearCalendar(year)
  
      if (stopAt === 'year') {
        this.showYearView()
        return
      }
  
      this.validateMonth()
  
      // update month calendar
      var targetDate = new Date(year, month, 1)
      this.drawMonthCalendar(targetDate)
  
      // automatically select date in monthly repeat mode
      if (
        this.defaults.repeat &&
        this.defaults.repeat.mode === this.REPEAT_MODE_MONTHLY
      ) {
        var lastDate = new Date(
          targetDate.getFullYear(),
          targetDate.getMonth() + 1,
          0
        )
  
        if (this.defaults.repeat.day === 0) {
          this.$date.val(lastDate.getDate())
        } else if (lastDate.getDate() < this.defaults.repeat.day) {
          this.$date.val(lastDate.getDate())
        } else {
          this.$date.val(this.defaults.repeat.day)
        }
      }
  
      if (stopAt === 'month') {
        this.showMonthView()
        return
      }
  
      this.validateDate()
  
      // update week calendar
      targetDate = new Date(year, month, date)
      this.drawWeekCalendar(targetDate)
  
      this.$dayOfWeek.val(this._getDayName(targetDate.getDay()))
  
      this.showWeekView()
  
      if (hideFinally) {
        this._hideView()
      }
    } catch (err) {
      // console.log(err)
    }
  }
  
  WbnDatePicker.prototype.ValidationException = function (value, message) {
    'use strict'
    this.value = value
    this.message = message
  }
  
  WbnDatePicker.prototype.validateYear = function () {
    'use strict'
    var year = this.$year.val()
    var message = 'Year not valid'
    var Exception = this.ValidationException
  
    if (year === '') {
      this.showYearView()
      throw new Exception(year, message)
    }
  
    if (this.isValidYear(year) === false) {
      this.$year.val('')
      this.showYearView()
      throw new Exception(year, message)
    }
  }
  
  WbnDatePicker.prototype.validateMonth = function () {
    'use strict'
    var year = this.$year.val()
    var month = this.$month.val()
  
    var message = 'Month not valid'
    var Exception = this.ValidationException
  
    var targetDate
  
    if (month === '') {
      targetDate = new Date(year, this.defaults.date.getMonth(), 1)
      this.drawMonthCalendar(targetDate)
      this.showMonthView()
      throw new Exception(month, message)
    }
  
    if (this.isValidMonth(year, month) === false) {
      this.$month.val('')
      this.$monthLabel.val('')
      targetDate = new Date(year, this.defaults.date.getMonth(), 1)
      this.drawMonthCalendar(targetDate)
      this.showMonthView()
      throw new Exception(month, message)
    }
  }
  
  WbnDatePicker.prototype.validateDate = function () {
    'use strict'
    var year = this.$year.val()
    var month = this.$month.val()
    var date = this.$date.val()
  
    var message = 'Date not valid'
    var Exception = this.ValidationException
  
    var targetDate
  
    if (date === '') {
      var sameYear = parseInt(this.$year.val()) ===
        this.defaults.date.getFullYear()
      var sameMonth = parseInt(this.$month.val()) ===
        this.defaults.date.getMonth()
  
      if (sameYear && sameMonth) {
        targetDate = this.defaults.date
      } else {
        targetDate = new Date(year, month, 1)
      }
  
      this.drawWeekCalendar(targetDate)
      this.showWeekView()
      throw new Exception(date, message)
    }
  
    if (this.isValidDate(year, month, date) === false) {
      this.$date.val('')
      targetDate = new Date(year, month, 1)
      this.drawWeekCalendar(targetDate)
      this.showWeekView()
      throw new Exception(date, message)
    }
  }
  
  WbnDatePicker.prototype.isValidYear = function (year) {
    'use strict'
    year = parseInt(year)
  
    if (year < this.defaults.min.getFullYear()) {
      return false
    }
  
    if (this.defaults.max.getFullYear() < year) {
      return false
    }
  
    return true
  }
  
  WbnDatePicker.prototype.isValidMonth = function (year, month) {
    'use strict'
    year = parseInt(year)
    month = parseInt(month)
  
    if (month < 0) {
      return false
    }
  
    if (month > 11) {
      return false
    }
  
    var isSameYear = this.defaults.min.getFullYear() ===
      this.defaults.max.getFullYear()
    var isMinYear = year === this.defaults.min.getFullYear()
    var isMaxYear = year === this.defaults.max.getFullYear()
  
    var minMonth = this.defaults.min.getMonth()
    var maxMonth = this.defaults.max.getMonth()
  
    if (isSameYear) {
      if (month < minMonth || maxMonth < month) {
        return false
      }
    } else if (isMinYear) {
      if (month < minMonth) {
        return false
      }
    } else if (isMaxYear) {
      if (maxMonth < month) {
        return false
      }
    }
  
    return true
  }
  
  WbnDatePicker.prototype.isValidDate = function (year, month, date) {
    'use strict'
    var selectedDate = new Date(year, month, date)
    var repeat = this.defaults.repeat
  
    if (isNaN(selectedDate.getTime())) {
      return false
    }
  
    if (selectedDate.getFullYear() !== parseInt(year)) {
      return false
    }
  
    if (selectedDate.getMonth() !== parseInt(month)) {
      return false
    }
  
    if (selectedDate.getDate() !== parseInt(date)) {
      return false
    }
  
    if (selectedDate < this.defaults.min) {
      return false
    }
  
    if (this.defaults.max < selectedDate) {
      return false
    }
  
    if (repeat) {
      switch (repeat.mode) {
        case this.REPEAT_MODE_WEEKLY:
          if (selectedDate.getDay() !== repeat.day) {
            return false
          }
          break
  
        case this.REPEAT_MODE_FORTNIGHTLY:
          if (selectedDate.getDay() !== repeat.day) {
            return false
          }
  
          if (selectedDate < repeat.start) {
            return false
          }
  
          var diffInDays = Math.ceil(
            (selectedDate - repeat.start) / (1000 * 3600 * 24)
          )
          if (diffInDays % 14 !== 0) {
            return false
          }
          break
  
        case this.REPEAT_MODE_MONTHLY:
          var lastDate = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth() + 1,
            0
          )
  
          if (selectedDate.getDate() !== repeat.day) {
            if (repeat.day === 0 || repeat.day > lastDate.getDate()) {
              if (lastDate.getDate() !== selectedDate.getDate()) {
                return false
              }
            } else {
              return false
            }
          }
          break
      }
    }
  
    return true
  }
  
  WbnDatePicker.prototype.isValidRepeatDay = function (repeatMode, repeatDay) {
    'use strict'
    switch (repeatMode) {
      case this.REPEAT_MODE_WEEKLY:
      case this.REPEAT_MODE_FORTNIGHTLY:
        if (repeatDay < 0 || repeatDay > 6) {
          return false
        }
        break
  
      case this.REPEAT_MODE_MONTHLY:
        if (repeatDay < 0 || repeatDay > 31) {
          return false
        }
        break
    }
  
    return true
  }
  
  WbnDatePicker.prototype._showView = function () {
    'use strict'
    this.$wrapper.addClass('active')
    this.$modal.addClass('active')
  }
  
  WbnDatePicker.prototype._hideView = function () {
    'use strict'
    this.$wrapper.removeClass('active')
    this.$modal.removeClass('active')
    this.$controls.find('input').blur()
  
    var month = parseInt(this.$month.val())
  
    // adjusting 0-based index
    month = isNaN(month) ? '' : month + 1
  
    var initial = this.$input.val()
    var final = [this.$year.val(), month, this.$date.val()].join('-')
  
    this.$input.val(final)
  
    if (initial !== final) {
      this.$input.trigger('change', final)
    }
  }
  
  WbnDatePicker.prototype._getDayName = function (index) {
    'use strict'
    index = index < 0 ? 0 : index
    index = index > 6 ? 6 : index
  
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
    return days[index]
  }
  
  WbnDatePicker.prototype._getMonthName = function (index) {
    'use strict'
    index = index < 0 ? 0 : index
    index = index > 11 ? 11 : index
  
    var months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ]
  
    return months[index]
  }
  
  WbnDatePicker.prototype.showYearView = function () {
    'use strict'
    this._showView()
    this.$viewsWrapper.addClass('year').removeClass('month week')
    this.$year.select()
  }
  
  WbnDatePicker.prototype.showMonthView = function () {
    'use strict'
    this._showView()
    this.$viewsWrapper.addClass('month').removeClass('year week')
    this.$monthLabel.select()
  }
  
  WbnDatePicker.prototype.showWeekView = function () {
    'use strict'
    this._showView()
    this.$viewsWrapper.addClass('week').removeClass('month year')
    this.$date.select()
  }
  
  WbnDatePicker.prototype.drawYearCalendar = function (targetYear) {
    'use strict'
    if (!targetYear) {
      targetYear = new Date().getFullYear()
    } else {
      targetYear = parseInt(targetYear)
    }
  
    var minDate = this.defaults.min
    var maxDate = this.defaults.max
  
    var yearHtml = '<ul class="year">'
    for (var i = maxDate.getFullYear(); i >= minDate.getFullYear(); i--) {
      yearHtml += getYearHtml(i, targetYear)
    }
    yearHtml += '</ul>'
  
    this.$yearView.html(yearHtml)
  
    function getYearHtml (year, currentYear) {
      var html = '<li data-year="' + year + '"'
  
      var classes = ['selectable']
      if (year === currentYear) {
        classes.push('active')
      }
  
      html += ' class="' + classes.join(' ') + '" '
  
      html += '>' + year + '</li>'
  
      return html
    }
  }
  
  WbnDatePicker.prototype.drawMonthCalendar = function (targetDate) {
    'use strict'
    if (!targetDate) {
      targetDate = this.defaults.date
    }
  
    var monthHtml = getMonthHtml(targetDate, this)
    this.$monthView.html(monthHtml)
  
    function getMonthHtml (targetDate, instance) {
      var html = '<ul class="month">'
      for (var i = 0; i < 12; i++) {
        html += '<li data-month="' + i + '"'
  
        var classes = []
  
        var isMinYear = targetDate.getFullYear() ===
          instance.defaults.min.getFullYear()
        var isMaxYear = targetDate.getFullYear() ===
          instance.defaults.max.getFullYear()
        var isSameYear = instance.defaults.min.getFullYear() ===
          instance.defaults.max.getFullYear()
  
        var minMonth = instance.defaults.min.getMonth()
        var maxMonth = instance.defaults.max.getMonth()
  
        if (isSameYear) {
          if (minMonth <= i && i <= maxMonth) {
            classes.push('selectable')
          }
        } else if (isMinYear) {
          if (minMonth <= i) {
            classes.push('selectable')
          }
        } else if (isMaxYear) {
          if (i <= maxMonth) {
            classes.push('selectable')
          }
        } else {
          classes.push('selectable')
        }
  
        if (i === targetDate.getMonth()) {
          classes.push('active')
        }
  
        html += ' class="' + classes.join(' ') + '" '
  
        html += '>' + instance._getMonthName(i) + '</li>'
      }
      html += '</ul>'
  
      return html
    }
  }
  
  WbnDatePicker.prototype.drawWeekCalendar = function (targetDate, repeat) {
    'use strict'
    if (typeof targetDate === 'undefined') {
      targetDate = this.defaults.date
    }
  
    if (typeof repeat === 'undefined') {
      repeat = this.defaults.repeat
    }
  
    var year = targetDate.getFullYear()
    var month = targetDate.getMonth()
    var activeDate = targetDate.getDate()
  
    var isMinMonth = year === this.defaults.min.getFullYear() &&
      month === this.defaults.min.getMonth()
    var isMaxMonth = year === this.defaults.max.getFullYear() &&
      month === this.defaults.max.getMonth()
  
    var minDate = this.defaults.min.getDate()
    var maxDate = this.defaults.max.getDate()
  
    var firstDayOfMonth = new Date(year, month, 1).getDay()
    var lastDate = new Date(year, month + 1, 0)
    var lastDateOfMonth = lastDate.getDate()
  
    var date = 1
    var calendarHtml = getDayLabelsHtml()
    var selectable = true
  
    while (date <= lastDateOfMonth) {
      calendarHtml += '<ul class="week">'
      for (var dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        if (date > lastDateOfMonth) {
          calendarHtml += getDateHtml()
          continue
        }
  
        // resetting selectable state
        selectable = true
  
        if (isMinMonth && date < minDate) {
          selectable = false
        }
  
        if (isMaxMonth && date > maxDate) {
          selectable = false
        }
  
        if (repeat) {
          switch (repeat.mode) {
            case this.REPEAT_MODE_WEEKLY:
              if (dayOfWeek !== repeat.day) {
                selectable = false
              }
              break
  
            case this.REPEAT_MODE_FORTNIGHTLY:
              var curIterationDate = new Date(year, month, date)
              if (dayOfWeek !== repeat.day) {
                selectable = false
              }
  
              if (curIterationDate < repeat.start) {
                selectable = false
              }
  
              var diffInDays = Math.ceil(
                (curIterationDate - repeat.start) / (1000 * 3600 * 24)
              )
              if (diffInDays % 14 !== 0) {
                selectable = false
              }
              break
  
            case this.REPEAT_MODE_MONTHLY:
              if (repeat.day === 0 || repeat.day > lastDateOfMonth) {
                if (date !== lastDateOfMonth) {
                  selectable = false
                }
              } else if (date !== repeat.day) {
                selectable = false
              }
              break
          }
        }
  
        if (date === 1) {
          if (dayOfWeek === firstDayOfMonth) {
            calendarHtml += getDateHtml(date, activeDate, selectable)
            date += 1
          } else {
            calendarHtml += getDateHtml()
          }
        } else {
          calendarHtml += getDateHtml(date, activeDate, selectable)
          date += 1
        }
      }
      calendarHtml += '</ul>'
    }
  
    this.$weekView.html(calendarHtml)
  
    function getDateHtml (date, activeDate, selectable) {
      'use strict'
      if (!date) {
        date = ''
      }
  
      if (typeof selectable === 'undefined') {
        selectable = true
      }
  
      var html = '<li data-date="' + date + '"'
  
      var classes = []
      if (date === activeDate) {
        classes.push('active')
      }
  
      if (date !== '' && selectable) {
        classes.push('selectable')
      }
  
      html += ' class="' + classes.join(' ') + '" '
  
      html += '>' + date + '</li>'
  
      return html
    }
  
    function getDayLabelsHtml () {
      'use strict'
      var labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
      var html = '<ul class="week labels">'
      for (var i = 0; i < labels.length; i++) {
        html += '<li>' + labels[i] + '</li>'
      }
      html += '</ul>'
  
      return html
    }
  }
  
  WbnDatePicker.prototype.bindUIActions_controls = function () {
    'use strict'
    this.$controls.on(
      'focus',
      'input:not([readonly])',
      $.proxy(this._showView, this)
    )
  
    this.$controls.on('focus', '.year', $.proxy(this.showYearView, this))
  
    this.$controls.on('change', '.year', $.proxy(this.showCalendar, this, false))
  
    this.$controls.on(
      'focus',
      '.month-label',
      $.proxy(this.showCalendar, this, false, 'month')
    )
  
    this.$controls.on(
      'keyup',
      '.month-label',
      $.proxy(validateTypedInMonth, this)
    )
  
    function validateTypedInMonth () {
      var typedMonth = this.$monthLabel.val().toLowerCase()
  
      if (typedMonth.length < 3) {
        this.$month.val('')
        return
      }
  
      var months = [
        'jan',
        'feb',
        'mar',
        'apr',
        'may',
        'jun',
        'jul',
        'aug',
        'sep',
        'oct',
        'nov',
        'dec'
      ]
  
      var selectedMonth = months.indexOf(typedMonth)
      this.$month.val(selectedMonth)
      // this.showCalendar()
    }
  
    this.$controls.on(
      'focus',
      '.date',
      $.proxy(this.showCalendar, this, false, 'week')
    )
  
    this.$controls.on('change', '.date', $.proxy(this.showCalendar, this))
  
    this.$controls.on('click', 'input:not([readonly])', function (ev) {
      ev.stopImmediatePropagation()
      // stops event bubbling
    })
  
    this.$controls.on('click', $.proxy(showCalendarTriggeredByClick, this))
  
    function showCalendarTriggeredByClick (ev) {
      ev.stopImmediatePropagation()
  
      var $target = $(ev.currentTarget)
  
      if ($target.hasClass('wbn-datepicker-controls') === false) {
        return
      }
  
      this.showCalendar(false)
    }
  
    this.$modal.on('click', $.proxy(this._hideView, this))
  }
  
  WbnDatePicker.prototype.bindUIActions_yearView = function () {
    'use strict'
    this.$yearView.on('click', 'ul.year > li', $.proxy(selectYear, this))
  
    function selectYear (ev) {
      var $target = $(ev.currentTarget)
  
      var selectedYear = $target.attr('data-year')
      this.$year.val(selectedYear)
  
      this.showCalendar()
    }
  }
  
  WbnDatePicker.prototype.bindUIActions_monthView = function () {
    'use strict'
    this.$monthView.on('click', 'ul.month > li', $.proxy(selectMonth, this))
  
    function selectMonth (ev) {
      var $target = $(ev.currentTarget)
  
      this.$monthLabel.val($target.text())
      var selectedMonth = $target.attr('data-month')
      this.$month.val(selectedMonth)
  
      this.showCalendar()
    }
  }
  
  WbnDatePicker.prototype.bindUIActions_weekView = function () {
    'use strict'
    this.$weekView.on(
      'click',
      'ul.week > li.selectable',
      $.proxy(selectDate, this)
    )
  
    function selectDate (ev) {
      var $target = $(ev.currentTarget)
  
      var selectedDate = $target.attr('data-date')
      this.$date.val(selectedDate)
  
      this.showCalendar()
    }
  }
  
  WbnDatePicker.prototype.registerListeners = function () {
    'use strict'
    if (!this.defaults.startSrc) {
      return
    }
  
    var $startDate = $('#' + this.defaults.startSrc)
    if ($startDate.length) {
      $startDate.on('change', $.proxy(this.resetCalendar, this))
    }
  }
  
  /**
   * Resets calendar when the source calendar value has changed
   */
  WbnDatePicker.prototype.resetCalendar = function (ev, value) {
    'use strict'
    var pattern = /^[\d]{4}-[\d]{1,2}-[\d]{1,2}$/
  
    if (!pattern.test(value)) {
      return
    }
  
    try {
      var repeatDate = updateRepeat(value, this)
  
      updateDefaultDates(repeatDate, this)
      this.drawYearCalendar()
      this.drawMonthCalendar()
      this.drawWeekCalendar()
  
      this.showCalendar()
    } catch (err) {
      console.error(err)
    }
  
    function _validateDate (value) {
      var date = new Date(value)
  
      if (isNaN(date.getTime())) {
        throw ['Not a valid date', 'isNaN', value].join(': ')
      }
  
      var reconstructed = [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
      ].join('-')
  
      if (reconstructed !== value) {
        throw ['Date reconstruction failed', value, reconstructed].join(': ')
      }
  
      return date
    }
  
    function updateRepeat (value, instance) {
      var date = _validateDate(value)
  
      if (instance.defaults.repeat === false) {
        return date
      }
  
      switch (instance.defaults.repeat.mode) {
        case instance.REPEAT_MODE_WEEKLY:
          instance.defaults.repeat.day = date.getDay()
          break
  
        case instance.REPEAT_MODE_FORTNIGHTLY:
          instance.defaults.repeat.day = date.getDay()
          instance.defaults.repeat.start = new Date(date.getTime() + (14 * 24 * 3600 * 1000))
          break
  
        case instance.REPEAT_MODE_MONTHLY:
          if (isLastDate(date)) {
            instance.defaults.repeat.day = 0
          } else {
            instance.defaults.repeat.day = date.getDate()
          }
          break
      }
  
      return date
    }
  
    function updateDefaultDates (repeatDate, instance) {
      var minDate
      if (instance.defaults.repeat === false) {
        minDate = progressByDays(repeatDate, 1)
        updateMinDate(instance, minDate)
        return
      }
  
      switch (instance.defaults.repeat.mode) {
        case instance.REPEAT_MODE_WEEKLY:
          minDate = progressByDays(repeatDate, 7)
          updateMinDate(instance, minDate)
          break
  
        case instance.REPEAT_MODE_FORTNIGHTLY:
          minDate = progressByDays(repeatDate, 14)
          updateMinDate(instance, minDate)
          break
  
        case instance.REPEAT_MODE_MONTHLY:
          var nextMonthLastDate = new Date(
            repeatDate.getFullYear(),
            repeatDate.getMonth() + 2,
            0
          )
  
          if (nextMonthLastDate.getDate() < repeatDate.getDate()) {
            instance.defaults.min = nextMonthLastDate
          } else {
            repeatDate.setMonth(repeatDate.getMonth() + 1)
            instance.defaults.min = repeatDate
          }
  
          if (instance.defaults.date < instance.defaults.min) {
            instance.defaults.date = instance.defaults.min
          }
          break
      }
  
      /**
       * Adds noOfDays to the given input date
       * @param {Date} ipDate
       * @param {Number} noOfDays
       */
      function progressByDays (ipDate, noOfDays) {
        var timeToAdd = noOfDays * 24 * 3600 * 1000
        var opDate = new Date(ipDate.getTime() + timeToAdd)
        return opDate
      }
  
      /**
       * Updates the instance's default min date
       * @param {WbnDatePicker} instance
       * @param {Date} minDate
       */
      function updateMinDate (instance, minDate) {
        instance.defaults.min = minDate
  
        if (instance.defaults.date < minDate) {
          instance.defaults.date = minDate
        }
      }
    }
  
    function isLastDate (date) {
      var lastDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      return date.getDate() === lastDate.getDate() && lastDate.getDate() > 29
    }
  }
  
  /**
   * Sets the value explicitly (from JavaScript)
   */
  WbnDatePicker.prototype.val = function (value) {
    'use strict'
    var pattern = /^[\d]{4}-[\d]{1,2}-[\d]{1,2}$/
  
    if (!pattern.test(value)) {
      return
    }
  
    this.$input.val(value)
  
    // update defaults
    this.defaults = this.parseDefaults()
  
    // draw calendar
    this.drawYearCalendar(this.defaults.date.getFullYear())
    this.drawMonthCalendar(this.defaults.date)
    this.drawWeekCalendar(this.defaults.date)
  
    // update labels
    this.$year.val(this.defaults.date.getFullYear())
    this.$monthLabel.val(
      this._getMonthName(this.defaults.date.getMonth())
    )
    this.$month.val(this.defaults.date.getMonth())
    this.$date.val(this.defaults.date.getDate())
  
    this.showCalendar()
  }
  
  // converting to plugin
  
  $.fn.customdatepicker = function () {
    'use strict'
    var $allDatepickers = []
    $(this).each(function () {
      var $this = $(this)
      var $datepicker = new WbnDatePicker($this)
  
      $allDatepickers.push($datepicker)
    })
  
    if ($allDatepickers.length === 1) {
      return $allDatepickers[0]
    } else {
      return $allDatepickers
    }
  }