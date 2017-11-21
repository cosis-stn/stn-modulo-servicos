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
 .service('ajudaSvc',function(metaFactory,$rootScope,ngDialog,toastr,$sce,$templateRequest,$compile,$route){
	
	//variavel que armazena o template sendo utilizado no momento
	this.templateModal = '';
	
	//função que identifica qual template utilizar 
	this.buscarTemplateCorrente = function(){
		var template;
		
		//caso exista informa? de template na ajudaSvc, utiliza essa info no lugar do routeProvider. 
		if (this.templateModal =='' ){
			template = $route.current.templateUrl;			
		}else{
			template = this.templateModal;			
		}
		
		//ajusta o nome do template preservando apenas o nome
		
		template = template.substring(6,template.length-5).toLowerCase();
		
		return template;
	}
	
	this.exibirAjudaTela = function(escopo){	
		var template;
		template = this.buscarTemplateCorrente();	
						
		//busca os dados da tela
		metaFactory['restTelaAjudaTemplateSvc'].get({id:template},function(dataTela){
			escopo.ajuda = dataTela;
			if (dataTela.textoAjuda==null){
				dataTela.textoAjuda = "O texto de ajuda ainda não foi cadastrado.";
			}
			escopo.divConteudoTextoAjudaTela = $sce.trustAsHtml(dataTela.textoAjuda);
			
			//busca os campos da tela
			if (dataTela.id != null){
				metaFactory['restItemAjudaTelaSvc'].query({id:dataTela.id},function(dataCampo){					
					escopo.ajuda.itensAjuda = dataCampo;
				});			
			}
			escopo.modalAjudaTela = ngDialog.open({
				template: 'views/ajudaTela.html',
				scope:escopo,
				closeByEscape: false
			});		
		});	
	}	
	
	//adiciona ao escopo a função de inserir novo item de ajuda
	this.prepararAjuda = function(escopo,servico){		
		
		escopo.manterAjuda =  function(nomeCampo,nomeControlador,rotuloCampo){
			servico.manterAjuda(nomeCampo,nomeControlador,rotuloCampo);
		}
		escopo.exibirAjuda =  function(nomeCampo,nomeControlador,rotuloCampo){			
			servico.exibirAjuda(nomeCampo,nomeControlador,rotuloCampo);
		}
		
		escopo.exibirAjudaTela =  function(){			
			servico.exibirAjudaTela(escopo);
		}
		
		escopo.trustAsHtml = $sce.trustAsHtml;
		
	}
	
	
	//fun? que abre a modal com as informa?s da ajuda do campo
	this.exibirAjuda = function(nomeCampo,nomeTemplate,rotuloCampo){			
		var parent = $rootScope;
		var novoScopo = parent.$new();
		var campoTmp = {};
		campoTmp.campo = nomeCampo;
		campoTmp.telaAjuda = {};
		campoTmp.telaAjuda.template = nomeTemplate;		
		metaFactory['restItemAjudaCampoSvc'].save('',campoTmp,function(data){
			novoScopo.obj = data;
			if (data.textoAjuda == null){
				data.textoAjuda = "Ajuda não cadastrada para o campo " + rotuloCampo + ".";
			}
			novoScopo.divConteudoTextoAjuda = $sce.trustAsHtml(data.textoAjuda);
			novoScopo.rotuloCampo = rotuloCampo;
			novoScopo.modalDetalhesAjudaCampo = ngDialog.open({
				template: 'views/ItemAjuda_campo_detalhe.html',				
				scope: novoScopo,
				closeByEscape: false				
			});
		});
	}	
	
	//fun? chamada quando o usu?o est?om o perfil admin e tenta abrir a ajuda.
	//exbie a tela de edi? de ajuda
	this.manterAjuda = function(nomeCampo,nomeTemplate,rotuloCampo){	
	var parent = $rootScope;
	var novoScopo = parent.$new();
	var campoTmp = {};
	campoTmp.campo = nomeCampo;
	campoTmp.telaAjuda = {};
	campoTmp.telaAjuda.template = nomeTemplate;		
	
	
	//recupera os dados da tela
	metaFactory['restTelaAjudaTemplateSvc'].get({id:this.buscarTemplateCorrente()},function(dataTela){
		if (dataTela.id == null){
			toastr.error('Tela não cadastrada.');
		} else {
			//recupera as informa?s do campo		
			metaFactory['restItemAjudaCampoSvc'].save('',campoTmp,function(dataCampo){
				var objTela = dataTela;
				novoScopo.telasAjuda = [];
				novoScopo.telasAjuda.push(objTela);
			
				//inicializa as variaveis e já preenche os campos com os valores passados pela função		
				novoScopo.obj = dataCampo;		
				novoScopo.campos = [];		
				novoScopo.obj.campo = nomeCampo;
				novoScopo.campos.push({nome:nomeCampo,label:rotuloCampo});	
				novoScopo.obj.telaAjuda= {};
				novoScopo.obj.telaAjuda.id = objTela.id;
		
			});
			
			//exibe a modal para editar o campo
			novoScopo.modalInserirAjuda = ngDialog.open({
				template: 'views/ItemAjuda_form.html',				
				scope: novoScopo,
				className: 'ngdialog-theme-default ngdialog-large'				
			});
			
			var tratarErro = function(data){
				if (data.status == 499) {
					var strErro = "<ol>";					
					var timeOut = 5000;
					for (var x = 0; x < data.data.length; x++) {
						strErro += "<li>";
						strErro += data.data[x];
						strErro += "</li>";
						timeOut += 1000;
					}
					strErro +="</ol>";
					toastr.warning(strErro, 'Ocorreram erros de validação', {allowHtml: true, timeOut : timeOut});
				} else {
					toastr.error('Erro ao cadastrar item.');
				}
			};

			novoScopo.salvarItemAjuda = function (){
				novoScopo.obj.rotulo =novoScopo.campos[novoScopo.campos.map(function(e) { return e.nome; }).indexOf(novoScopo.obj.campo)].label;
				if (novoScopo.obj.id == undefined){
					metaFactory['restItemAjudaSvc'].save(novoScopo.obj, function () {
						toastr.success('Item cadastrado com sucesso.');
						ngDialog.close(novoScopo.modalInserirAjuda.id);				
					}, function (data) {
						tratarErro(data);
					});
				}else{			
					metaFactory['restItemAjudaSvc'].update({'id':novoScopo.obj.id},novoScopo.obj, function () {
						toastr.success('Item cadastrado com sucesso.');
						ngDialog.close(novoScopo.modalInserirAjuda.id);				
					}, function (data) {
						tratarErro(data);
					});
				}
			};	
			
		
		}
		
	
	});	
	} 
 })
 .service('perfilSvc', function(LoginSvc, $rootScope, $location,menuSvc, toastr) {	
 
 
	 this.checarLogin = function() {
		var parent = $rootScope;
		var novoScopo = parent.$new();
		var usuario = {};
		
		 if (JSON.parse(localStorage.getItem('usuario'))==null){
			 localStorage.usuario=JSON.stringify({});
		 }
		LoginSvc.get({}, function (data){
			if (data.name === undefined || data.name === '') {
				localStorage.logado = "false";
				if ($rootScope.next.indexOf('/login') > -1){
					//indo para o login				
					if(localStorage.logado === "true"){									
						//usuario ja logado. impede de ir para o login
						if (localStorage.proximaUrl==undefined || localStorage.proximaUrl==""){						
                            
						  $location.path('/');
                        } else {						
                            $location.path(localStorage.proximaUrl.substr(localStorage.proximaUrl.indexOf('#')+1));
                        }					
					}
				}else {						
					if(localStorage.logado === "false"){
						//usuario n?logado. for?login	
						localStorage.usuario = JSON.stringify({});
						localStorage.usuarioPerfil = "";
						localStorage.logado = "false";	
						localStorage.perfilSet = undefined;								
						localStorage.proximaUrl = $rootScope.next;
						
						$location.path( '/login' );	
						$rootScope.usuarioLogado = false;
					}
				}
			}else{
				usuario = data;				
				localStorage.usuario = JSON.stringify(usuario);	
				
				novoScopo.perfils = [];
				//preenche a variável de perfils "novoScopo.perfils" sem considerar os perfis do business-central "admin" e "user"
				
				for (var i = 0; i < data.roles.length; i++){
					if (data.roles[i] !== "admin" && data.roles[i] !== "user"){					
						novoScopo.perfils.push(data.roles[i]);
					}
				}
		
				if (localStorage.logado === "false"){
					novoScopo.perfilEscolhido = novoScopo.perfils[0];					
					if (localStorage.proximaUrl==undefined || localStorage.proximaUrl==""){						
                        
						$location.path('/');
					} else {				
                        
						$location.path(localStorage.proximaUrl.substr(localStorage.proximaUrl.indexOf('#')+1));
					}
					localStorage.proximaUrl = "";
					$rootScope.usuarioLogado = true;
					localStorage.logado = "true";
					menuSvc.alterarMenu();
				}
			}	
		}, function() {
			//tratamento de erro
			toastr.error('Sistema indisponível. ');
			localStorage.usuario = JSON.stringify({});
			localStorage.usuarioPerfil = "";
			localStorage.logado = "false";	
			localStorage.perfilSet = undefined;		
			$location.path( '/login' );
		});
		menuSvc.alterarMenu();
		
	 }

})
 