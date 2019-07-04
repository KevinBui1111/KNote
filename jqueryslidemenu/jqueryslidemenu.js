/*********************
//* jQuery Multi Level CSS Menu #2- By Dynamic Drive: http://www.dynamicdrive.com/
//* Last update: Nov 7th, 08': Limit # of queued animations to minmize animation stuttering
//* Menu avaiable at DD CSS Library: http://www.dynamicdrive.com/style/
*********************/

//Update: April 12th, 10: Fixed compat issue with jquery 1.4x

//Specify full URL to down and right arrow images (23 is padding-right to add to top level LIs with drop downs):
var arrowimages={down:['downarrowclass', 'jquerySlideMenu/arrow-down.png', 23], right:['rightarrowclass', 'jquerySlideMenu/arrow-right.png']}

var jqueryslidemenu={

animateduration: {over: 100, out: 100}, //duration of slide in/ out animation, in milliseconds

buildmenu:function(menuid, arrowsvar){
	jQuery(document).ready(function($){
    var $mainmenu = $("#" + menuid);
    var $headers = $mainmenu.find(".kmenu").parent();
		$headers.each(function(i){
      var $curobj = $(this);
      var $subul = $(this).find('.kmenu:eq(0)');
			this._dimensions={w:this.offsetWidth, h:this.offsetHeight, subulw:$subul.outerWidth(), subulh:$subul.outerHeight()}
			this.istopheader=$curobj.parents("ul").length==1? true : false
			//$subul.css({top:/*this.istopheader? this._dimensions.h+"px" :*/ 0})
			$curobj.children(".title")/*.css(this.istopheader? {paddingRight: arrowsvar.down[2]} : {})*/.append(
        '<span class="' + (/*this.istopheader? arrowsvar.down[0] :*/ arrowsvar.right[0]) + '">&#9701;</span>'
			)
			$curobj.hover(
				function(e){
          var $targetul = $(this).children(".kmenu:eq(0)");
					this._offsets={left:$(this).offset().left, top:$(this).offset().top}
          var menuleft =/*this.istopheader? 0 :*/ this.offsetWidth;
					menuleft=(this._offsets.left+menuleft+this._dimensions.subulw>$(window).width())? (/*this.istopheader? -this._dimensions.subulw+this._dimensions.w :*/ -this._dimensions.w) : menuleft
					if ($targetul.queue().length<=1) //if 1 or less queued animations
            $targetul.css({ left: menuleft + "px" })
              .slideDown(jqueryslidemenu.animateduration.over)
				},
				function(e){
          var $targetul = $(this).children(".kmenu:eq(0)");
					$targetul.slideUp(jqueryslidemenu.animateduration.out)
				}
			) //end hover
			//$curobj.click(function(){
			//	$(this).children("ul:eq(0)").hide()
			//})
		}) //end $headers.each()
    //$mainmenu.find("ul").hide();
	}) //end document.ready
}
}

//build menu with ID="myslidemenu" on page:
jqueryslidemenu.buildmenu("myslidemenu", arrowimages)