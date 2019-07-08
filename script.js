"use strict";

var maxid = 0;
var max_zindex = 0;
var list_note = [];
var current_note;
var dic_label = {};
var dic_label_note = {};

const URL_ROOT = 'http://localhost:10101'
  ,URL_GET =    URL_ROOT + '/LA/la_get'
  ,URL_UPDATE = URL_ROOT + '/LA/la_update'
  ,urlparam = new URLSearchParams(document.location.search)
  ,USERNAME = urlparam.get('username') || 'kevinbui'
  ,WEB_APP = 'knote'
  ,STORAGE_NAME = WEB_APP + '_' + USERNAME
;

$(document).ready(function () {
  la_get();
});

function on_receive_data(data_server, textStatus, jqXHR) {
  if (data_server) data_server.DATA_CONTENT = JSON.parse(data_server.DATA_CONTENT);
  // check data from db is new or old
  var data_local = JSON.parse(localStorage[STORAGE_NAME] || null);

  var data_apply = null;
  if (data_local && data_server) {
    data_apply = data_local.DATE_UPDATED > data_server.DATE_UPDATED ? data_local : data_server;
  }
  else data_apply = data_local || data_server;

  list_note = data_apply ? data_apply.DATA_CONTENT : [];

  list_note.forEach((e, i) => {
    maxid = Math.max(maxid, e.id);

    var newid = 'knote-' + e.id;
    var newnote = $('#knote_temp').clone()
      .prop('id', newid)
      .attr('data-id', e.id)
      .css("z-index", e.zindex)
      .css('height', e.position.h)
      .css('width', e.position.w)
      .css('left', e.position.left)
      .css('top', e.position.top)
      .css('background-color', e.backgroundColor)
      .css('color', e.color)
      ;
    newnote[0].label = [];
    e.label.forEach(lb => add_label(newnote[0], lb));

    $('.container').append(newnote);
    newnote.find('.content')
      .html(e.content)
      .attr("class", e.class)
      .css('max-height', e.position.h - newnote.find('.header').innerHeight());

    apply_event(newnote[0]);
  });

  max_zindex = list_note.length;

  var maxheight = 0;
  $(".container > *").each((i, e) => { maxheight = Math.max(maxheight, e.offsetTop + e.offsetHeight); });
  $(".container").height(maxheight);

  $('#color_list div').click(() => {
    current_note.style.backgroundColor = $(event.target).css('background-color');
    current_note.style.color = $(event.target).css('color');
  });

  var chosen_label = $('#ddl_label').chosen({
    no_results_text: 'Enter to add new'
    ,width: '100%' 
  });

  // Get the chosen object
  var chosen = chosen_label.data('chosen');
  // Bind the keyup event to the search box input
  chosen.search_field.on('keyup', function (e) {
    // If we hit Enter and the results list is empty (no matches) add the option
    if (e.which === 13 && chosen.dropdown.find('li.no-results').length > 0) {
      var option = $("<option>").text(this.value);
      // Add the new option
      chosen_label.prepend(option);
      // Automatically select it
      chosen_label.find(option).prop('selected', true);
      // Trigger the update
      chosen_label.trigger("chosen:updated");
      chosen_label.trigger("change", { selected: option.val() });
    }
  });
  chosen_label.change(label_change);

  $('#label-area').on('click', '.label,.defaultlabel', function (e) {
    if (!e.ctrlKey)
      $('.label').removeClass('selected');

    $(this).toggleClass('selected');

	  var seleceted_label = $('#label-area .label.selected').toArray().map(lb=>lb.innerHTML);
	  var match_and = $('.defaultlabel').hasClass('selected');

	  document.querySelectorAll('.container .knote').forEach(note => {
		  var visible = match_and ? 
			  seleceted_label.every(lb => note.label.includes(lb)) :
			  note.label.some(lb => seleceted_label.includes(lb));

      note.style.visibility = visible ? '' : 'hidden';
	  });
  });

  setInterval(save_note, 10000);
}

String.prototype.format = function () {
  var s = this;
  for (var i = 0; i < arguments.length; i++) {
    var reg = new RegExp("\\(p" + i + "\\)", "g");
    s = s.replace(reg, arguments[i]);
  }

  return s;
}

function create_note() {
  ++max_zindex;
  var newid = 'knote-' + ++maxid;
  var newnote = $('#knote_temp').clone()
    .prop('id', newid)
    .css("z-index", max_zindex)
    .attr('data-id', maxid);
  $('.container').append(newnote);

  newnote[0].label = [];
  // add current node
  document.querySelectorAll('#label-area .label.selected').forEach(lb => add_label(newnote[0], lb.innerHTML));

  apply_event(newnote[0]);
}
function apply_event(newnote) {
  apply_resize(newnote.id);
  apply_drag(newnote.id);

  newnote.addEventListener("focusin", () => { newnote.style.zIndex = ++max_zindex; });
  //newnote.addEventListener("paste", (e) => {
  //  e.preventDefault();
  //  var text = '';
  //  var that = $(this);

  //  text = e.clipboardData.getData('text/plain')
  //    .replace(/\r\n|\r|\n/g, '<br />')
  //    .replace(/  /g, '&nbsp; ')
  //    .replace(/  /g, '&nbsp; ')
  //    ;

  //  if (document.queryCommandSupported('insertText')) {
  //    document.execCommand('insertHTML', false, text);
  //  }
  //});
  //newnote.querySelector('.code').addEventListener("click", () => {
  //  var self = event.target;
  //  var content = self.parentElement.nextElementSibling;
  //  //if (self.classList.contains('selected')) {
  //  //  content.classList.remove('code');
  //  //}
  //  //else {
  //  //  content.className += " code";
  //  //}
  //  self.classList.toggle('selected');
  //  content.classList.toggle('code');

  //});
  newnote.querySelector('.close').addEventListener("click", (e) => {
    if (confirm('Are you sure to DELETE?')) newnote.parentElement.removeChild(newnote);
  });
}
function apply_resize(id) {
  var divnote = document.getElementById(id);
  var wrapper = divnote.parentElement;

  var divcontent = divnote.getElementsByClassName('content')[0];
  var divhead = divnote.getElementsByClassName('header')[0];

  function mousedown (e) {
    var isDown = this.edge_type;
    var offset = [
      divnote.offsetWidth - e.clientX,
      divnote.offsetHeight - e.clientY
    ];

    function mousemove_event(event) {
      event.preventDefault();
      if (isDown == 1 || isDown == 3) {
        var newW = Math.max(event.clientX + offset[0], 0);
        newW = Math.min(newW, wrapper.offsetWidth - divnote.offsetLeft);
        divnote.style.width = newW + 'px';
      }
      if (isDown == 2 || isDown == 3) {
        var newH = Math.max(event.clientY + offset[1], 0);
        newH = Math.min(newH, wrapper.offsetHeight - divnote.offsetTop);
        divnote.style.height = newH + 'px';
        divcontent.style.maxHeight = (divnote.offsetHeight - divhead.offsetHeight) + 'px';
      }
    };

    document.addEventListener('mousemove', mousemove_event);
    document.addEventListener('mouseup', function mouseup_event() {
      isDown = 0;
      this.removeEventListener('mousemove', mousemove_event);
      this.removeEventListener('mouseup', mouseup_event);
    });
  };

  var edge = divnote.getElementsByClassName('edge-right')[0];
  edge.edge_type = 1;
  edge.addEventListener('mousedown', mousedown);

  edge = divnote.getElementsByClassName('edge-bottom')[0];
  edge.edge_type = 2;
  edge.addEventListener('mousedown', mousedown);

  edge = divnote.getElementsByClassName('corner')[0];
  edge.edge_type = 3;
  edge.addEventListener('mousedown', mousedown);
}

function apply_drag(id) {
  // make draggable
  var dialog = document.getElementById(id);
  var wrapper = dialog.parentElement;
  var header = dialog.getElementsByClassName('header')[0];

  header.addEventListener('mousedown', function (e) {
    var isDown = true;
    var offset = [
      dialog.offsetLeft - e.clientX,
      dialog.offsetTop - e.clientY
    ];

    function mousemove_event(event) {
      event.preventDefault();
      if (isDown) {
        var newX = Math.max(event.clientX + offset[0], 0);
        var newY = Math.max(event.clientY + offset[1], 0);
        //newX = Math.min(newX, dialog.parentElement.offsetWidth - dialog.offsetWidth);
        //newY = Math.min(newY, dialog.parentElement.offsetHeight - dialog.offsetHeight);

        dialog.style.left = newX + 'px';
        dialog.style.top = newY + 'px';

        wrapper.style.height = Math.max(wrapper.offsetHeight, dialog.offsetTop + dialog.offsetHeight) + 'px';
      }
    }

    document.addEventListener('mousemove', mousemove_event);
    document.addEventListener('mouseup', function mouseup_event() {
      isDown = false;
      this.removeEventListener('mousemove', mousemove_event);
      this.removeEventListener('mouseup', mouseup_event);
    });
  });
  header.addEventListener('contextmenu', show_color_list);
}

function save_note() {
  list_note = [];
  $(".container .knote").each((i, e) => {
    var content = e.getElementsByClassName('content')[0];
    var note = {};
    note.position = { top: e.offsetTop, left: e.offsetLeft, w: e.offsetWidth, h: e.offsetHeight };
    note.zindex = e.style.zIndex;
    note.id = e.getAttribute('data-id');
    note.content = content.innerHTML;
    note.class = content.className;
    note.backgroundColor = e.style.backgroundColor;
    note.color = e.style.color;
    note.label = e.label;

    list_note.push(note);
  });

  list_note.sort((a, b) => a.zindex - b.zindex);

  list_note.forEach((e, i) => { e.zindex = i; });

  // localStorage.note = JSON.stringify(list_note);
  localStorage[STORAGE_NAME] = JSON.stringify({
    DATE_UPDATED: new Date(),
    DATA_CONTENT: list_note
  });
  la_update();
}

function show_color_list(e) {
  e.preventDefault();

  current_note = e.target.parentElement;

  //populate tag to selection
  generate_ddl_label();

  $('#myslidemenu').css({ top: e.offsetY + this.parentElement.offsetTop , left: e.pageX/*, "z-index": 990*/ });
  $('#myslidemenu').show();
  document.addEventListener('click', function mouseclick_event() {
    var close = !$(event.target).is('.noclose, .noclose *');
    if (close) {
      $('#myslidemenu').hide();
      this.removeEventListener('click', mouseclick_event);
    }
  });
}

function toggle_code_style() {
  var self = event.target;
  var content = current_note.querySelector('.content');
  self.classList.toggle('selected');
  content.classList.toggle('code');
}

function label_change(e, p) {
  if (p.selected) add_label(current_note, p.selected)
  else if (p.deselected) remove_label(p.deselected);
}
function add_label(note, label) {
  note.label.push(label);

  dic_label[label] = dic_label[label] || [];
  dic_label[label].push(note.getAttribute('data-id'));

  dic_label_note[label_note(note, label)] = 1;

  var divlabel = $('#label-area > div').filter((i, e) => e.innerHTML === label);
  if (divlabel.length == 0)
    $('#label-area').append('<div class="label">' + label + '</div>');
}
function remove_label(label) {
  var id = current_note.getAttribute('data-id');

  current_note.label = current_note.label.filter(lb => lb != label);
  dic_label[label] = dic_label[label].filter(lb => lb != id);

  delete dic_label_note[label_note(current_note, label)];

  if (dic_label[label].length == 0) {
    delete dic_label[label];
    var divlabel = $('#label-area > div').filter((i, e) => e.innerHTML === label);
    divlabel.remove();
  }
}
function generate_ddl_label() {
  var option_dom = '';
  for (var lb in dic_label) {
    var selected = dic_label_note[label_note(current_note, lb)] ? 'selected' : '';
    option_dom += '<option ' + selected + '>' + lb + '</option>';
  }

  $('#ddl_label')
    .html(option_dom)
    .trigger("chosen:updated");
}

function label_note(note, label) {
  return note.getAttribute('data-id') + ' - ' + label;
}

function la_get() {
  $.get (
    URL_GET,
    {
      username: USERNAME,
      web_app: WEB_APP,
    },
    on_receive_data,
  )
  .fail(function(jqxhr, textStatus, error)  {
    console.log( "error la_get" );
    on_receive_data();
  })
}

function la_update() {
  $.post (
    URL_UPDATE,
    {
      username: USERNAME,
      web_app: WEB_APP,
      data_content: JSON.stringify(list_note)
    },
    function (data){
      //alert('Thanks! ' + JSON.stringify(data));
    }
  )
  .fail(function(jqxhr, textStatus, error)  {
    alert( "error la_update " + error );

  })
}