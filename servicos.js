'use strict';

angular.module('stn.modulo-servicos',[])
.service('roleSvc',function(){	 
	 this.isInRole = function(role){		 		 
		 if (localStorage.usuarioPerfil === role){			 									
			 return true;			 
		 }else {							
			return false;
		 }	
	};
 })
 .service('menuSvc',function(){
	 this.alterarMenu = function(){
		 var usuario = JSON.parse(localStorage.usuario);		 		 
		if (usuario.name!==undefined) {
			$('#linkLogin').hide();
			$('#UsuarioLogado').show();
			$('#divMenu').show();			
			
		} else {
			$('#linkLogin').show();
			$('#UsuarioLogado').hide();
			$('#divMenu').hide();										
		}				 
	 };	 
 })
 