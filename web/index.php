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
		const FILENAME_MAP = ' /^(tile_)(\-?[\d]+)([_])(\-?[\d]+)(\.(.*))$/i';
		const FILENAME_FORMAT = 'tile_%s_%s';

/* * *****************************************************************************************************************************************************************************************************
 * SCRIPT
 * **************************************************************************************************************************************************************************************************** */

$_HEADER = getallheaders();
if (isset($_HEADER['X-Requested-With']) && $_HEADER['X-Requested-With'] == "XMLHttpRequest" || isset($_REQUEST['a'])) {
	header('Content-type: application/json');
	if (isset($_REQUEST['a'])) {

        include ROOT . '/lib/php-curl-class/src/Curl/CaseInsensitiveArray.php';
        include ROOT . '/lib/php-curl-class/src/Curl/MultiCurl.php';
		include ROOT . '/lib/php-curl-class/src/Curl/Curl.php';
		$curl = new Curl\Curl();

		switch ($_REQUEST['a']) {
			case "load":
				$JSON	 = is_file(MAPS_STORAGE_FILE) ? file_get_contents(MAPS_STORAGE_FILE) : "{}";
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
//				$dir = ROOT . DIR_SEP . DATA_FOLDER;
				foreach ($DATA['maps'] as $idx => &$map) {
					unset($map['hash']);
//					foreach ($map['tiles'] as $coord => &$row) {
//						if (is_file($dir . DIR_SEP . ($file = $row['file']))) {
//						if (preg_match(FILENAME_MAP, $file, $fileMatch)) {
//							$mime	 = explode("/", $mimeStr = trim(image_type_to_mime_type(exif_imagetype($file))));
//							if ($mime[0] == "application" && $mime[1] == "octet-stream") {
//								$mine	 = ($mime[0] = "image") . "/" . ($mime[1] = $fileMatch[count($fileMatch) - 1]);
//							}
//
//							$imagick_type	 = new Imagick();
//							$file_handle	 = fopen($dir . DIR_SEP . $file, 'a+');
//							if ($imagick_type->readImageFile($file_handle)) {
//								$signature	 = $imagick_type->getImageSignature();
//
//							if ($mime[0] == "image") {
//								$newFile = sprintf("%s.%s", $signature, $mime[1]);
//								if (rename($dir . DIR_SEP . $file, $dir . DIR_SEP . $newFile)) {
//									header("$file-rename: {$newFile}");
//									$row['file'] = $newFile;
//								$row['hash'] = $signature;
//								} else {
//									header("$file-cant-rename: {$newFile}");
//								}
//							} else {
//								header("$file-mime: " . json_encode($mimeStr));
//							}
//						} 
//					}
//							}
//						}
//					}
					$map['hash'] = sha1(json_encode($map));
				}
//
//				$DATA['maps'][1] = $DATA['maps'][0];
//
				$DATA['ts']	 = filemtime(MAPS_STORAGE_FILE);
				$JSON		 = json_encode($DATA);
//				file_put_contents(MAPS_STORAGE_FILE, $JSON);

				/*
				 * NEW
				 */

//				if (!$changed) {
				$client_last_modified	 = !empty($_SERVER['HTTP_IF_MODIFIED_SINCE']) ? strtotime(trim($_SERVER['HTTP_IF_MODIFIED_SINCE'])) : null;
				$file_last_modified		 = $DATA['ts'];
				header("mod: " . date("r", $client_last_modified) . " => " . date("r", $file_last_modified));
				if ($client_last_modified >= $file_last_modified) {
					header($_SERVER['SERVER_PROTOCOL'] . ' 304 Not Modified');
					exit(304);
				}
				die($JSON);
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
//				$JSON = json_encode($DATA);
//				file_put_contents(MAPS_STORAGE_FILE, $JSON);
//
//				die($JSON);
				break;

			case "upload":
				session_start();
				$response	 = false;
				$mapId		 = isset($_POST['mapId']) ? $_POST['mapId'] : null;
				$posX		 = isset($_POST['x']) ? intval($_POST['x']) : null;
				$posY		 = isset($_POST['x']) ? intval($_POST['y']) : null;
				$coords		 = sprintf("%s_%s", $posX, $posY);
				if (count($_FILES) > 0 && $mapId !== null && $posX !== null && $posY !== null) {
					$JSON	 = is_file(MAPS_STORAGE_FILE) ? file_get_contents(MAPS_STORAGE_FILE) : "{}";
					$DATA	 = json_decode($JSON, true);

					$imagick	 = new Imagick();
					$path		 = ROOT . DIR_SEP . DATA_FOLDER . DIR_SEP;
					$_FILE		 = $_FILES[0];
					$file_handle = fopen($_FILE['tmp_name'], 'a+');
					if ($imagick->readImageFile($file_handle)) {
						$hash		 = $imagick->getImageSignature();
						$ext		 = strtolower($imagick->getImageFormat());
						$file		 = $hash . "." . $ext;
						$filePath	 = $path . $file;

						if (!is_file($filePath))
							move_uploaded_file($_FILE['tmp_name'], $filePath);
						else
							unlink($_FILE['tmp_name']);

						$tile = [
							'posX'	 => $posX,
							'posY'	 => $posY,
							'hash'	 => $hash,
							'file'	 => $file,
							'size'	 => filesize($filePath),
							'date'	 => filemtime($filePath),
						];

						$response['maps'][$mapId]['tiles'][$coords]	 = $tile;
						$DATA['maps'][$mapId]['tiles'][$coords]		 = $tile;

						$DATA['maps'][$mapId]['hash'] = sha1(json_encode($DATA['maps'][$mapId]));
						header("new-hash: {$DATA['maps'][$mapId]['hash']}");

						$JSON = json_encode($DATA);
						file_put_contents(MAPS_STORAGE_FILE, $JSON);
					}
				}
				die(json_encode($response));
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
	die(false);
}

include("../map.html");

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