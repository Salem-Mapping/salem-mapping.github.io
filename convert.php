<?php

const x = +44;
const y = -114; 
const mapID = "Providence";

$json = file_get_contents("maps.json.org");
$data = json_decode($json, true);

$tiles = $data['maps'][mapID]['tiles'];
$newTiles = [];

foreach($tiles AS $key => $tile) {
	$tile['posX'] -= x;
	$tile['posY'] -= y;
	$nKey = $tile['posX'].'_'.$tile['posY'];
	$newTiles[$nKey]  =  $tile;
	echo "$key => $nKey\n";
}

echo "old: " . count($tiles) . "\n";
echo "new: " . count($newTiles) . "\n";

$data['maps'][mapID]['tiles'] = $newTiles;
echo "old-hash: {$data['maps'][mapID]['hash']}\n";
$data['maps'][mapID]['hash'] = sha1(json_encode($data['maps'][mapID]['tiles']));
echo "new-hash: {$data['maps'][mapID]['hash']}\n";
$json = json_encode($data, true);
#file_put_contents("maps.json", $json);



