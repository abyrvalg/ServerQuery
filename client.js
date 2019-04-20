var dataUrl = window.location.origin+'/data';
module.exports = {
	call(query){
		return new Promise((resolver)=>{
			var xmlHttpRequest = new XMLHttpRequest();
			xmlHttpRequest.addEventListener('load', ()=>{
				try{
					resolver(JSON.parse(xmlHttpRequest.responseText));
				}
				catch(e){
					resolver(xmlHttpRequest.responseText);
				}
			});
			xmlHttpRequest.open('GET', dataUrl+'?query='+JSON.stringify(query));
			xmlHttpRequest.send();
		});		
		
	},
	setDataUrl(url){
		dataUrl = url;
	}
}