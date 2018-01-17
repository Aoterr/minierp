aolong.mobile.login = (function() {
	
	var initEvent = function() {
		eip.select('#login').on('tap',function(){
			var name=eip.select("#account").val();
			alert(name);
		});
	}
	
	return {
		init: function() {
			eip.ready(function() {
				initEvent();
			}) 
		}
	}
})();