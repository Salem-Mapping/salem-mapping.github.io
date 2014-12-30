<?php

error_reporting(E_ALL ^ E_NOTICE);

if (!defined("DIR_SEP"))
	define("DIR_SEP", DIRECTORY_SEPARATOR);
/* * *****************************************************************************************************************************************************************************************************
 * CONFIG
 * **************************************************************************************************************************************************************************************************** */

define("ROOT", dirname(__DIR__));
		const MAPS_STORAGE_FILE = ROOT . DIRECTORY_SEPARATOR . "maps.json";
		const DATA_FOLDER = 'web/data';
		const FILENAME_MAP = ' /^(tile_)(\-?[0-9]+)([_])(\-?[0-9]+)(\.(.*))$/i';
		const FILENAME_FORMAT = 'tile_%s_%s';

//define("DROPBOX_APP_KEY", 'cog274db738jxvc');
//define("DROPBOX_APP_SECRET", '3h5qoe3j68xc32t');
//define("DROPBOX_AUTHORIZATION_CODE", 'XnWIUg-OIrEAAAAAAAAABV6pcNik0-FItTODagLwOcA');
// {"access_token": "XnWIUg-OIrEAAAAAAAAAB7XLPgp-XuxNuvDZd7SP2MNvLx2Rk1cFSNovSpRU3CPi", "token_type": "bearer", "uid": "221550161"}
//define("DROPBOX_ACCESS_TOKEN", 'XnWIUg-OIrEAAAAAAAAAB7XLPgp-XuxNuvDZd7SP2MNvLx2Rk1cFSNovSpRU3CPi');



/* * *****************************************************************************************************************************************************************************************************
 * SCRIPT
 * **************************************************************************************************************************************************************************************************** */

$_HEADER = getallheaders();
if (isset($_HEADER['X-Requested-With']) && $_HEADER['X-Requested-With'] == "XMLHttpRequest" || isset($_GET['a'])) {
	header('Content-type: application/json');
	if (isset($_REQUEST['a'])) {

		include ROOT . '/lib/php-curl-class/src/Curl/Curl.php';
		$curl = new Curl\Curl();

		switch ($_REQUEST['a']) {
			case "load":

				$JSON	 = is_file(MAPS_STORAGE_FILE) ? file_get_contents(MAPS_STORAGE_FILE) : "null";
				$DATA	 = json_decode($JSON, true);

				/*
				 * CHECK
				 */

//				$changed = false;
//				$fileMap = $lastDATA['maps'][0];
//				$handle	 = opendir($dir	 = ROOT . DIR_SEP . DATA_FOLDER);
//				while (false !== ($file	 = readdir($handle))) {
//					if (preg_match(FILENAME_MAP, $file, $m)) {
//						$fullPath = $dir . DIR_SEP . $file;
//						if (!isset($fileMap["{$m[2]}_{$m[4]}"]) || filemtime($fullPath) > $fileMap["{$m[2]}_{$m[4]}"]['date']) {
//							$changed = true;
//							break;
//						}
//					}
//				}

				$dir = ROOT . DIR_SEP . DATA_FOLDER;
				foreach ($DATA['maps'][0] as $coord => &$row) {
					if (preg_match(FILENAME_MAP, $file = $row['file'], $m)) {
						$imagick_type	 = new Imagick();
						$file_handle	 = fopen($dir . DIR_SEP . $file, 'a+');
						$imagick_type->readImageFile($file_handle);
						$signature		 = $imagick_type->getImageSignature();

						$tmp	 = explode("/", $mime	 = trim(image_type_to_mime_type(exif_imagetype($file))));
						if ($tmp[0] == "application" && $tmp[1] == "octet-stream") {
							$mine	 = ($tmp[0]	 = "image") . "/" . ($tmp[1]	 = $m[count($m) - 1]);
						}
						if ($tmp[0] == "image") {
							$newFile = sprintf("%s.%s", $signature, $tmp[1]);
							if (rename($dir . DIR_SEP . $file, $dir . DIR_SEP . $newFile)) {
								header("$file-rename: {$newFile}");
								$row['file'] = $newFile;
								$row['hash'] = $signature;
							} else {
								header("$file-cant-rename: {$newFile}");
							}
						} else {
							header("$file-mime: " . json_encode($mime));
						}
					}
				}

				$JSON = json_encode($DATA);
				file_put_contents(MAPS_STORAGE_FILE, $JSON);

				/*
				 * NEW
				 */

//				if (!$changed) {
				$client_last_modified	 = !empty($_SERVER['HTTP_IF_MODIFIED_SINCE']) ? strtotime(trim($_SERVER['HTTP_IF_MODIFIED_SINCE'])) : null;
				$file_last_modified		 = filemtime(MAPS_STORAGE_FILE);
//					header("File-Last-Modified:" . date("r", $file_last_modified));
//					header("Client-Last-Modified:" . date("r", $client_last_modified));
				if ($client_last_modified >= $file_last_modified) {
//					header($_SERVER['SERVER_PROTOCOL'] . ' 304 Not Modified');
//					exit(304);
				}
				//				}
//				$DATA		 = array (
//					'maps' => array ()
//				);
//				$size		 = 0;
//				$file_map	 = array ();
//				$handle		 = opendir($dir		 = ROOT . DIR_SEP . DATA_FOLDER);
//				while (false !== ($file		 = readdir($handle))) {
//					if (preg_match(FILENAME_MAP, $file, $m)) {
//						$fullPath					 = $dir . DIR_SEP . $file;
//						$imageData					 = base64_encode(file_get_contents($fullPath));
//						$src						 = 'data: ' . mime_content_type($fullPath) . ';base64,' . $imageData;
//						$fileMap["{$m[2]}_{$m[4]}"]	 = array (
//							'posX'	 => intval($m[2]),
//							'posY'	 => intval($m[4]),
//							'hash'	 => sha1($src),
//							'file'	 => $file,
//							'size'	 => filesize($dir . DIR_SEP . $file),
//							'date'	 => filemtime($dir . DIR_SEP . $file)
//						);
//						$size += filesize($dir . DIR_SEP . $file);
//					}
//				}
//				$DATA['maps'][]	 = $fileMap;
//				$DATA['maxsize'] = $size + 1 * 1024 * 1024;
//				closedir($handle);
//				$JSON			 = json_encode($DATA);
//				file_put_contents(MAPS_STORAGE_FILE, $JSON);

				die($JSON);
				break;

			case "upload":
				if (count($_FILES) > 0) {
					$filepath = ROOT . DIR_SEP . DATA_FOLDER . DIR_SEP;
					foreach ($_FILES AS $key => $_FILE) {
						if (preg_match(FILENAME_MAP, $_FILE['name'], $m)) {
							$filename	 = $m[1] . $_REQUEST['x'] . $m[3] . $_REQUEST['y'] . $m[5];
							$ret		 = (move_uploaded_file($_FILE['tmp_name'], $filepath . $filename));
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

/* * *****************************************************************************************************************************************************************************************************
 * TRASH
 * **************************************************************************************************************************************************************************************************** */

/* elseif(isset($_GET['up'])) {
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
  } */
?>