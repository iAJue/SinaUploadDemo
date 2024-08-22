<?php
// 设置响应头为 JSON 格式
header("Content-type:application/json");

// 检查文件是否上传
if (!isset($_FILES["file"])) {
    echo json_encode(["code" => 400, "msg" => "没有文件上传！"]);
    exit;
}

// 获取文件信息
$file = $_FILES["file"];
$fileName = $file["name"];
$fileType = $file["type"];
$fileSize = $file["size"];
$uploadDirectory = 'upload';
$extension = pathinfo($fileName, PATHINFO_EXTENSION);

// 生成唯一文件名
$newFileName = uniqid() . '.' . $extension;

// 允许的文件类型
$allowedTypes = ["image/gif", "image/jpeg", "image/jpg", "image/x-png", "image/png"];

// 检查文件类型和大小
if (!in_array($fileType, $allowedTypes)) {
    echo json_encode(["code" => 201, "msg" => "只允许上传gif、jpeg、jpg、png格式的图片文件！"]);
    exit;
}

if ($fileSize > 10485760) {
    echo json_encode(["code" => 201, "msg" => "文件大小超出限制！最大只能上传10MB的文件！"]);
    exit;
}

// 移动文件到上传目录
if (!move_uploaded_file($file["tmp_name"], $uploadDirectory . "/" . $newFileName)) {
    echo json_encode(["code" => 201, "msg" => "文件上传失败！"]);
    exit;
}

// 上传至指定服务器
$filepath = realpath(dirname(__FILE__)) . "/" . $uploadDirectory . "/" . $newFileName;
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://service.account.weibo.com/aj/uploadimg2');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, ['ftype' => 12, 'file' => new CURLFile($filepath)]);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

// 设置请求头
$headers = [
    "Cookie: 你的cookie", // 请替换为你的 Cookie
    "origin: https://service.account.weibo.com",
    "pragma: no-cache",
    "referer: https://service.account.weibo.com/reportspam?rid=2892492275&type=3&from=1FFFF96039"
];
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// 发起请求
$uploadimg = curl_exec($ch);
curl_close($ch);

// 解析请求结果
$response = json_decode($uploadimg, true);
$code = $response['code'] ?? null;
$data = $response['data'] ?? null;

if ($code == 100000) {
    preg_match('/"picid":"([a-zA-Z0-9_]+)"/', $data, $matches);
    if (isset($matches[1])) {
        $picid = $matches[1];
        $imgUrl = "http://lz.sinaimg.cn/large/{$picid}.jpg";
        echo json_encode(["code" => 200, "msg" => "上传成功", "path" => $imgUrl]);

        // 保存链接至文本文件
        $logFile = 'upload_log.txt';
        file_put_contents($logFile, $imgUrl . "\n", FILE_APPEND);
    } else {
        echo json_encode(["code" => 201, "msg" => "图片上传失败！"]);
    }
} else {
    echo json_encode(["code" => 201, "msg" => "图片上传失败！"]);
}

// 删除临时文件
unlink($filepath);
?>
