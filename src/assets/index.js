get = (url, buffer) =>
    new Promise((reslove, reject) => {
        var xhr = new XMLHttpRequest();
        if (buffer) xhr.responseType = 'arraybuffer';
        xhr.timeout = 90000;
        xhr.open('GET', url);
        xhr.send();
        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4){
                if (xhr.status == 200) {
                    reslove(xhr.response);
                } else {
                    console.log(xhr)
                    utools.showNotification('网络请求出错，状态码：' + xhr.status)
                    reslove("")
                }
            }
        };
    })

updateImgs = () => {
    if(window.WallPapers){
        var imgs = document.querySelectorAll('#content img')
        for (var i = 0; i < 4; i++) {
            var img = imgs[i]
            img.className = 'hide';
            img.src = window.WallPapers[i].thumbs.large
            img.onload = function () {
                this.className = 'show';
            }
        }
    }
}

fetchWallpaper = async () => {
    var url = `https://wallhaven.cc/api/v1/search?categories=${window.preferences.categories}&purity=${window.preferences.purity}&atleast=${window.preferences.atleast}&sorting=${window.preferences.sorting}&ratios=16x9&apikey=${window.preferences.apikey}&page=${window.preferences.page}`
    try {
        var response = await get(url, false)
        window.WallPapers = JSON.parse(response).data
    } catch (e) {
        console.log(e)
    }
}

utools.onPluginEnter(async () => {
    // if(isRunningAtFirstTime()) showChangeLog()
    utools.setExpendHeight(480)
    if (!window.WallPapers) {
        try {
            window.preferences = utools.db.get("WallPaperPreferences").data;
        } catch (error) {
            window.preferences = {
                categories: "111",
                purity: "100",
                sorting: "random",
                atleast: "2560x1440",
                apikey: "",
                unlock: false,
                page: 1
            }
        }
        await fetchWallpaper()
        updateImgs()
    }
})

showOptions = i => {
    Swal.fire({
        html: `<img class="options" src="img/download.svg" title="下载壁纸" onclick=downloadWallPaper()>
        <img class="options" src="img/wallpaper.svg" title="设为壁纸" onclick=setWallPaper()>
        <img class="options" src="img/raw.svg" title="查看原图" onclick=showWallPaper()>
        <img class="options" src="img/paste.svg" title="复制到剪贴板" onclick=copyWallPaper()>
        `,
        footer: `[${window.WallPapers[i].file_type.split('/')[1].toUpperCase()}][${window.WallPapers[i].resolution}][${(window.WallPapers[i].file_size/1000000).toFixed(2)}M]`,
        showConfirmButton: false,
        onBeforeOpen: () => {
            downloadImg = async () => {
                var response = await get(window.WallPapers[i].path, true)
                var img = new Uint8Array(response)
                return img
            }

            downloadWallPaper = async () => {
                var img = await downloadImg()
                var path = utools.showSaveDialog({
                    defaultPath: `${window.WallPapers[i].path.split('/').pop()}`
                })
                if (path && img) window.saveImg(path, window.toBuffer(img))
            }

            setWallPaper = async () => {
                var img = await downloadImg()
                if (img) {
                    var path = window.joinpath(utools.getPath('temp'), window.WallPapers[i].path.split('/').pop())
                    window.saveImg(path, window.toBuffer(img))
                    setDesktop(path)
                }
            }

            showWallPaper = () => {
                utools.shellOpenExternal(window.WallPapers[i].path)
            }

            copyWallPaper = async () => {
                var img = await downloadImg()
                if (img) {
                    utools.copyImage(img)
                    Swal.fire({
                        text: "复制完成",
                        icon: "success"
                    })
                }
            }
        }
    })
}

// 偏好设置
showPreferences = async () => {
    var result = await Swal.fire({
        title: "偏好设置",
        onBeforeOpen: () => {
            for (var i = 0; i < 3; i++){
                document.querySelectorAll("input[name='categories']")[i].checked = parseInt(window.preferences.categories[i])
            }
            for (var i = 0; i < 3; i++){
                document.querySelectorAll("input[name='purity']")[i].checked = parseInt(window.preferences.purity[i])
            }
            document.getElementById('sorting').value = window.preferences.sorting;
            document.getElementById('atleast').value = window.preferences.atleast;
            document.getElementById('apikey').value = window.preferences.apikey;
            var sage = document.querySelectorAll("input[name='purity']")[2];
            if (!window.preferences.unlock) sage.parentElement.style.opacity = 0;
            if (!/^[a-zA-Z0-9]{32}$/.test(window.preferences.apikey) || !window.preferences.unlock) sage.disabled = true;
        },
        // backdrop: '#bbb',
        html:
        `<table>
        <tr>
            <td width=20%><div class="title">风格分类</div></td>
            <td width=60%>
                <div class="pretty p-default">
                    <input type="checkbox" name="categories" />
                    <div class="state p-primary">
                        <label>普通</label>
                    </div>
                </div>
                <div class="pretty p-default">
                    <input type="checkbox" name="categories" />
                    <div class="state p-primary">
                        <label>动漫</label>
                    </div>
                </div>
                <div class="pretty p-default">
                    <input type="checkbox" name="categories" />
                    <div class="state p-primary">
                        <label>人物</label>
                    </div>
                </div>
            </td>
        </tr>
        <tr>
            <td><div class="title">图片等级</div></td>
            <td>
                <div class="pretty p-default">
                    <input type="checkbox" name="purity" />
                    <div class="state p-primary">
                        <label>正常</label>
                    </div>
                </div>
                <div class="pretty p-default">
                    <input type="checkbox" name="purity" />
                    <div class="state p-primary">
                        <label>开放</label>
                    </div>
                </div>
                <div class="pretty p-default">
                    <input type="checkbox" name="purity" />
                    <div class="state p-danger">
                        <label>贤者</label>
                    </div>
                </div>
            </td>
        </tr>
        <tr>
            <td><div class="title">排序规则</div></td>
            <td>
                <select id="sorting" class="swal2-select">
                    <option value="date_added">最近</>
                    <option value="random">随机</>
                    <option value="views">浏览量</>
                    <option value="favorites">收藏量</>
                    <option value="toplist">排行榜</>
                </select>
            </td>
        </tr>
        <tr>
            <td><div class="title">最小尺寸</div></td>
            <td>
                <select id="atleast" class="swal2-select">
                    <option value="1920x1080">1080p</>
                    <option value="2560x1440">2k</>
                    <option value="3840x2160">4k</>
                </select>
            </td>
        </tr>
        <tr>
            <td><div class="title">API KEY</div></td>
            <td>
                <input value="${window.preferences.apikey}" id="apikey" class="swal2-input">
            </td>
        </tr>
    </table>`,
        focusConfirm: false,
        confirmButtonText: '保存',
        preConfirm: async () => {
            var categories = "";
            for (var i of document.querySelectorAll("input[name='categories']")) {
                categories += (i.checked * 1).toString()
            }
            var purity = "";
            for (var i of document.querySelectorAll("input[name='purity']")) {
                purity += (i.checked * 1).toString()
            }
            var data = {
                categories: categories,
                purity: purity,
                sorting: document.getElementById('sorting').value,
                atleast: document.getElementById('atleast').value,
                apikey: document.getElementById('apikey').value,
                unlock: window.preferences.unlock,
                page: window.preferences.page
            }
            if (JSON.stringify(window.preferences) == JSON.stringify(data)) return "";
            return data;
        }
    })
    var data = result.value;
    if (data) {
        data.page = 1;
        window.preferences = data;
        pushData("WallPaperPreferences", data);
        await fetchWallpaper()
        updateImgs()
    }
}

document.querySelector('#givemefour').onclick = async function () {
    if (window.WallPapers.length >= 8) {
        window.WallPapers = window.WallPapers.slice(4)
    } else {
        window.preferences.page += 1
        await fetchWallpaper()
    }
    updateImgs()
}

document.querySelector('#preference').onclick = function () {
    showPreferences()
}

for (var i = 0; i < 4; i++) {
    var imgbox = document.querySelectorAll('#content .imgbox')[i]
    imgbox.i = i
    imgbox.onclick = function () {
        showOptions(this.i)
    }
}

document.onkeydown = e => {
    if (e.which == 85 && e.ctrlKey) {
        Swal.fire({
            title: 'How do you find this ?',
            input: 'text',
            inputAttributes: {
                autocapitalize: 'off'
            }
        }).then((result) => {
            if (result.value == '↑↑↓↓←→←→BABA') {
                window.preferences.unlock = true;
                Swal.fire({
                    text: 'something has changed !'
                })
            }
        })
    }
}
