<?php
if ( !defined("DIR_SEP"))
	define("DIR_SEP", DIRECTORY_SEPARATOR);
/*******************************************************************************************************************************************************************************************************
 * CONFIG
 ******************************************************************************************************************************************************************************************************/

define("ROOT", dirname(__DIR__));
define("DATA_FOLDER", 'web/data');
define("FILENAME_MAP", ' /^(tile_)(\-?[0-9]+)([_])(\-?[0-9]+)(\..*)$/i');
define("FILENAME_FORMAT", 'tile_%s_%s');
define("IS_SSL", (substr($_SERVER['SERVER_PROTOCOL'], 0, 5) == "HTTPS"));
define("PROTOCOL", 'http' . ((IS_SSL) ? 's' : '') . '://');

define("DROPBOX_APP_KEY", 'cog274db738jxvc');
define("DROPBOX_APP_SECRET", '3h5qoe3j68xc32t');
define("DROPBOX_AUTHORIZATION_CODE", 'XnWIUg-OIrEAAAAAAAAABV6pcNik0-FItTODagLwOcA');
// {"access_token": "XnWIUg-OIrEAAAAAAAAAB7XLPgp-XuxNuvDZd7SP2MNvLx2Rk1cFSNovSpRU3CPi", "token_type": "bearer", "uid": "221550161"}
define("DROPBOX_ACCESS_TOKEN", 'XnWIUg-OIrEAAAAAAAAAB7XLPgp-XuxNuvDZd7SP2MNvLx2Rk1cFSNovSpRU3CPi');

/*******************************************************************************************************************************************************************************************************
 * SCRIPT
 ******************************************************************************************************************************************************************************************************/

$_HEADER = getallheaders();
if (isset($_HEADER['X-Requested-With']) && $_HEADER['X-Requested-With'] == "XMLHttpRequest" || isset($_GET['a'])) {
	header('Content-type: application/json');
	if (isset($_REQUEST['a'])) {
		
		include ROOT.'/lib/php-curl-class/src/Curl/Curl.php';
		$curl = new Curl\Curl();
		
		switch ($_REQUEST['a']) {
			case "load":
				$DATA = array(
				    'map' => array()
				);
				$handle = opendir($dir = ROOT . DIR_SEP . DATA_FOLDER);
				$size = 0;
				while (false !== ($file = readdir($handle))) {
					if (preg_match(FILENAME_MAP, $file, $m)) {
						$fullPath = $dir . DIR_SEP . $file;
						$imageData = base64_encode(file_get_contents($fullPath));
						$src = 'data: ' . mime_content_type($fullPath) . ';base64,' . $imageData;
						$DATA['map']["{$m[2]}_{$m[4]}"] = array(
						    'posX'  => intval($m[2]),
						    'posY'  => intval($m[4]),
						    'hash' => sha1($src),
						    'file' => $file,
						    'size' => filesize($dir . DIR_SEP . $file),
						    'date' => filemtime($dir . DIR_SEP . $file)
						);
						$size += filesize($dir . DIR_SEP . $file);
					}
				}
				$DATA['maxsize'] = $size;
				closedir($handle);
				die(json_encode($DATA));
				break;
			
			case "upload":
				if (count($_FILES) > 0) {
					$filepath = ROOT . DIR_SEP . DATA_FOLDER . DIR_SEP;
					foreach ($_FILES AS $key => $_FILE) {
						if (preg_match(FILENAME_MAP, $_FILE['name'], $m)) {
							$filename = $m[1] . $_REQUEST['x'] . $m[3] . $_REQUEST['y'] . $m[5];
							$ret = (move_uploaded_file($_FILE['tmp_name'], $filepath . $filename));
						}
					}
					die(json_encode($filename));
				}
				break;
			
			case "del":
				$basename = sprintf(FILENAME_FORMAT, $_REQUEST['x'], $_REQUEST['y']);
				foreach (glob(ROOT . DIR_SEP . DATA_FOLDER . DIR_SEP . $basename . ".*") as $file) {
					if (is_file($file)) {
						unlink($file);
					}
				}
				die(json_encode(true));
				break;
			
			default:
		}
		die(json_encode(false));
	}
}

include("map.html");

/*******************************************************************************************************************************************************************************************************
 * TRASH
 ******************************************************************************************************************************************************************************************************/

/*elseif(isset($_GET['up'])) {
    header("test: HEADER");
        if(isset($_GET['base64'])) {
                $content = base64_decode(file_get_contents('php://input'));
        } else {
                $content = file_get_contents('php://input');
        }

        $headers = getallheaders();
        $headers = array_change_key_case($headers, CASE_UPPER);

        if(file_put_contents(dirname(__FILE__).$DATA_FOLDER.'/'.$headers['UP-FILENAME'], $content)) {
                echo 'true';
        }
        exit();
}*/
?>