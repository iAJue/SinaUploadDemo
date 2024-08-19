# 新浪图片上传 - 阿珏酱
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import logging

app = Flask(__name__)

# 启用CORS，允许所有域名访问
CORS(app)

# 设置日志记录
logging.basicConfig(level=logging.INFO)

# 上传图片到微博的函数
def upload_image(filepath):
    # 上传接口的URL
    url = 'https://service.account.weibo.com/aj/uploadimg2'

    # 请求头设置
    headers = {
        'cookie': (
            'SUB=自己设置cookies'
            'SUBP='
        ),
        'referer': 'https://service.account.weibo.com/reportspam?rid=2892492275&type=3&from=1FFFF96039',
        'user-agent': ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                       'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'),
    }

    # 上传的表单数据
    data = {
        'ftype': 12
    }

    # 上传的文件数据
    files = {
        'file': ('image.jpg', open(filepath, 'rb'), 'image/jpeg')
    }

    try:
        # 发送POST请求
        response = requests.post(url, headers=headers, data=data, files=files)
        response.raise_for_status()  # 检查请求是否成功
        return response.text
    except requests.exceptions.RequestException as e:
        logging.error(f"图片上传失败: {e}")
        return None

# 处理文件上传的接口
@app.route('/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        return jsonify({'error': '未找到文件部分'}), 400
    
    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': '未选择文件'}), 400

    # 临时保存上传的文件
    filepath = os.path.join('/tmp', file.filename)
    file.save(filepath)

    # 上传图片到微博
    result = upload_image(filepath)

    # 删除临时文件
    os.remove(filepath)

    if result:
        return jsonify({'result': result})
    else:
        return jsonify({'error': '图片上传失败'}), 500

if __name__ == '__main__':
    # 生产环境配置
    app.run(host='0.0.0.0', port=5000)