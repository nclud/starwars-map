<?php header('Access-Control-Allow-Origin: *'); //allow cross-origin

error_reporting(0); //set default error reporting as disabled

if ($_GET['errors'] === '') { error_reporting(E_ALL); ini_set('display_errors', 1); } //enable error reporting if parameter is present

$url = $_GET['url']; //get url parameter
$urls = explode(',', $url); //create array from passed urls
$expire = $_GET['expire']; //get expiration threshold
$allData = array(); //create JSON collector

$cachedir = 'cache/'; //set cache directory name
is_dir($cachedir) || mkdir($cachedir, 0777, true); //create cache directory if it does not exist

if ($_GET['direct'] === '') { //check for caching bypass
	//header('Location: ' . $urls[0], true, 301); //moved permanently
	header('Location: ' . $urls[0], true, 302); //moved temporarily
} else { //if no cache bypass flag present

	if ($_GET['json'] === '') { $json = true; } //check if JSON is flagged

	foreach ($urls as $uri) { //loop through passed urls
		$input = file_get_contents(urldecode($uri)); //get target contents
		$hash = md5($uri); //set filename
		$time = time();  //set current time
		$filename = $hash . '-' . $time; //filename with timestamp
		$path = $cachedir . $filename; //set full path to cached file
		$pattern = $cachedir . $hash . '*'; //filename search pattern
		$matches = array_reverse(glob($pattern)); //reversed array of files that contain hash

		if(empty($matches)) { //if no matching files found
			writeFile($path, $input); //write new file to server
			outputFile($path, $json); //output newly written file

		} else { //else if matching files found
			$match = $matches[0]; //newest matching file
			$filedate = substr($match, strrpos($path, '-') + 1); //get date of matched file
			$fileage = $time - $filedate; //determine file age

			if(($time - $filedate) > $expire) { //check if file has expired
				foreach ($matches as $file) { unlink($file); }  //delete all expired files
				writeFile($path, $input); //write fresh file to server
				outputFile($path, $json); //output freshly written file

			} else { outputFile($match, $json); } //else output cached file

		} //matched file loop
	} //passed urls loop
} //if no cache bypass loop

if ($json) { echo str_replace('\\/', '/', json_encode($allData/*, JSON_UNESCAPED_SLASHES*/)); } //output JSON if flagged (with manual unescaping)

function writeFile($path, $input) { file_put_contents($path, $input); } //write file to server

function outputFile($path, $json) { //variable function for outputting file contents or pushing JSON to collector
	global $allData; //reference JSON collector
	$output = file_get_contents($path); //read file from server
	if ($json) { //if format is JSON
		$data = json_decode($output, true); //convert object to JSON
		$allData = array_merge_recursive($allData, $data); //push and merge JSON data to collector
	} else { echo $output; } //if non-JSON format then print file contents
} //outputFile function