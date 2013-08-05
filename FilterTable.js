(function($) {
  $.FilterTable = function(element, data, options) {
    function isEmpty(val) { return (val === undefined || val == null || val.length <= 0) ? true : false; }

    var defaults = {};
    this.settings = {};

    this.$table = $(element);
    this.table = crossfilter(data);
    this.filters = {};
    this.sort_column = '';
    this.sort_direction = 'bottom';
    this.columns = [];
    this.data = function(d) {
      if (typeof d == 'object') {
        this.table = crossfilter(d);
        // redraw table?
      }
      return this.table;
    };
    this.init = function() {
      this.settings = $.extend({}, defaults, options);

      $.each(data[0], $.proxy(function(k, v) {
        if (k.indexOf('id') == -1) {
          this.filters[k] = this.table.dimension(function(d) {return d[k] != null ? (d[k].toLowerCase ? d[k].toLowerCase() : d[k]) : "";});
        }
      }, this));

      var search_row = '<tr>';
      this.$table.find(' > thead > tr:first-child > th').each($.proxy(function(index, el) {
        $this = $(el);
        var column = $this.data('column'),
            type = $this.data('column-type');
        this.columns[index] = column;
        search_row += "<th align='center'>";
        if (type == 'str') {
          search_row += "<input type='text' id='FtSearch-" + column + '-' + type + "' style='width: 90%;' />";
        }
        else if (type == 'sel') {
          search_row += "<select id='FtSearch-" + column + '-' + type + "' style='width: 90%;'><option></option>";
          var opts = $this.data('column-values') ? $this.data('column-values') : $.map(this.filters[column].group().all(),function(v, i){return v.key;});
          $.each(opts, function(i, v) {
            search_row += "<option value='" + v + "'>" + v + '</option>';
          });
          search_row += '</select>';
        }
        else if (type == 'num') {
          search_row += "<input type='text' id='FtSearch-" + column + '-' + type + "-min' style='margin-right: 1px; width: 25px;' placeholder='min' />";
          search_row += "<input type='text' id='FtSearch-" + column + '-' + type + "-max' style='width: 25px;' placeholder='max' />";
        }
        else {
          search_row += '&nbsp;';
        }
        search_row += '</th>';
      }, this));
      search_row += '</tr>';
      search_row = $(search_row);
      search_row.appendTo(this.$table.find(' > thead'));

      search_row.find('input').keyup($.proxy(function(e) {
        console.log('started : ' + (new Date()).getTime());
        var col = e.target.id.split('-')[1],
            type = e.target.id.split('-')[2],
            val = e.target.value,
            new_html = '', new_cache = [], tmp;

        if (e.keyCode == 8) {
          console.log('delete');
        }

        if (type == 'num') {
          this.filters[col].filter(function(min, max) { return function(d) { return (isEmpty(min) || d >= min) && (isEmpty(max) || d <= max); }; }(
            $('#FtSearch-' + col + '-num-min').val(), $('#FtSearch-' + col + '-num-max').val()
          ));
        }
        else if (type == 'str') {
           this.filters[col].filter(function(val) { return function(d) { return d.indexOf(val) != -1; }; }(val.toLowerCase()));
        }
        this.render(this.filters[col][this.sort_direction](Infinity));

        console.log('filtered : ' + (new Date()).getTime());
      }, this));
      search_row.find('select').change($.proxy(function(e) {
        var col = e.target.id.split('-')[1],
            val = $(e.target).val();
        this.filters[col].filter(function(val) { return function(d) { return isEmpty(val) || d == val; }; }(val.toLowerCase()));
        this.render(this.filters[col][this.sort_direction](Infinity));
      }, this));
      this.render(data);
    };

    this.render = function(d) {
      var html = '', i, j, len = {};
      len.d = d.length;
      len.c = this.columns.length;
      for (i = 0; i < len.d; i++) {
        html += '<tr data-FtIndex="' + i + '" data-ftid="' + d[i].id + '">';
        for (j = 0; j < len.c; j++) {
          html += '<td>';
          html += d[i][this.columns[j]];
          html += '</td>';
        }
        html += '</tr>';
      }
      this.$table.find(' > tbody').html(html);
      console.log('rendered : ' + (new Date()).getTime());
    };

    this.init.apply(this, arguments);
  };

  $.fn.FilterTable = function(data) {
    return this.each(function() {
      var context = jQuery(this);
      jQuery(this).data('FilterTable', new $.FilterTable(context, data));
    });
  };
})(jQuery);

