<?php
// CLI-only request harness. Not copied into the runtime image or document root.
declare(strict_types=1);
if (PHP_SAPI !== 'cli') exit(1);
$request=json_decode(stream_get_contents(STDIN),true,512,JSON_THROW_ON_ERROR);
putenv('VIBESIGNAL_STORAGE_DIR='.$request['storage']);
putenv('VIBE_TEST_MODE=1');
ini_set('session.save_path',$request['sessions']);
if(isset($request['core']))putenv('VIBECORE_DATABASE='.$request['core']);
$_SERVER['REMOTE_ADDR']=$request['remote']??'127.0.0.1';
$_GET=$request['get'] ?? []; $_POST=$request['post'] ?? [];
$_SERVER['REQUEST_METHOD']=$request['method'] ?? 'GET';
$_SERVER['HTTP_ACCEPT']=$request['accept'] ?? ''; 
if (isset($request['session'])) session_id($request['session']);
register_shutdown_function(static function(): void {
    fwrite(STDERR,json_encode(['status'=>http_response_code() ?: 200,'session'=>session_id()]));
});
$endpoint=in_array($request['endpoint']??'', ['signals','cluster','refresh','story','desk','system','dashboard','sources','content','organize','media','presentation','queue','status','settings','activity'],true)?$request['endpoint']:'index';
$_SERVER['SCRIPT_NAME']=($request['prefix'] ?? (getenv('VIBE_TEST_PREFIX') ?: '/signal')).'/'.$endpoint.'.php';
require dirname(__DIR__) . '/public/'.$endpoint.'.php';
