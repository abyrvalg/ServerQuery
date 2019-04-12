var dataUrl;
module.exports = {
	call(query, template){
		return new Promise((resolver)=>{
			var xmlHttpRequest = new XMLHttpRequest();
			xmlHttpRequest.addEventListener('load', ()=>{
				resolver(this.responseText);
			});
			xmlHttpRequest.open('POST', dataUrl);
			xmlHttpRequest.send('query='+JSON.stringify(query));
		});		
		
	},
	setDataUrl(url){
		dataUrl = url;
	}
}