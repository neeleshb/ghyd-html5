self.onmessage = function(e) {
	var n = 1;
    while (true) {
	   n++;
	   var found = true;
	   for (var i = 2; i <= Math.sqrt(n); ++i) {
	      if (n % i == 0) {
		     found = false;
			 break;
		  }
	   }
	if (found == true) {
		postMessage(n);
	}
   }
};
