<template>
  <el-dropdown trigger="click" @command="handleCommand" placement="top-start">
    <div class="el-dropdown-link tool-menu-item">
      文件
    </div>
    <el-dropdown-menu slot="dropdown">
      <el-dropdown-item command="import"><i class="iconfont icon-dakaiwenjianjia"></i>打开文件</el-dropdown-item>
      <el-dropdown-item command="export"><i class="iconfont icon-quanbubaocungongzuobiao"></i>另存为文件</el-dropdown-item>
      <el-dropdown-item command="saveImg"><i class="iconfont icon-chucunweitupian"></i>快速出图</el-dropdown-item>
      <el-dropdown-item command="clean"><i class="iconfont icon-qingchu"></i>清除缓存</el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>

import {Loading} from "element-ui";
import {saveAs} from 'file-saver';

export default {
  name: "index",
  methods: {
    handleCommand(val) {
      switch (val) {
        case "import":
          this.importEntity()
          break;
        case "export":
          this.exportEntity()
          break;
        case "saveImg":
          this.save2Image()
          break;
        case "clean":
          this.clean()
          break;
      }
    },
    /** 导入文件 */
    importEntity() {
      const input = document.createElement('input');
      input.type = 'file';
      input.addEventListener('change', (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          const fileContent = e.target.result;
          const animation = JSON.parse(fileContent);
          let loadingInstance = Loading.service({fullscreen: true});
          this.$cesiumHelper.loadSourceFromJson(animation).then(entities => {
            const list = entities.filter(item => item !== null).map(entity => {
              return this.$cesiumHelper.getEntityInfo(entity)
            })
            this.$store.dispatch("addEntitySource", list)
            loadingInstance.close();
          })
        };
        reader.readAsText(file);
      });
      input.click();
    },

    /** 导出文件 */
    exportEntity() {
      // 检查浏览器是否支持 File System Access API
      if ('showSaveFilePicker' in window) {
        // 配置文件保存对话框的选项
        const opts = {
          types: [{
            description: 'JSON 文件',
            accept: {
              'application/json': ['.json'],
            },
          }],
        };
        // 使用 showSaveFilePicker 方法显示文件保存对话框
        window.showSaveFilePicker(opts)
            .then((fileHandle) => {
              // 创建可写入文件的文件句柄
              return fileHandle.createWritable()
                  .then((writable) => {
                    const fileName = fileHandle.name.split(".")[0]
                    // 获取实体数据
                    let animation = this.$cesiumHelper.export();
                    console.log(animation)
                    animation.name = fileName
                    // 将实体数据转换为格式化的 JSON 字符串
                    const jsonString = JSON.stringify(animation, null, 2);
                    // 创建一个 Blob 对象，用于存储 JSON 数据
                    const blob = new Blob([jsonString], {type: 'application/json'});
                    // 写入 Blob 数据到文件
                    writable.write(blob);
                    // 关闭文件句柄
                    return writable.close();
                  });
            })
            .catch((err) => {
              // 处理保存文件时出现的错误
              console.error('保存文件出错:', err);
            });
      } else {
        // 如果不支持 File System Access API，提供仅设置名称的选项
        const fileName = prompt('请输入文件名', '态势标绘.json');
        if (!fileName) {
          // 用户取消输入，不进行保存
          return;
        }
        // 获取实体数据
        let animation = this.$cesiumHelper.export();
        animation.name = fileName
        // 将实体数据转换为格式化的 JSON 字符串
        const jsonString = JSON.stringify(animation, null, 2);
        // 创建一个 Blob 对象，用于存储 JSON 数据
        const blob = new Blob([jsonString], {type: 'application/json'});
        // 使用 FileSaver.js 保存文件，设置文件名为用户输入的名称
        saveAs(blob, fileName)
      }
    },
    /** 导出当前视角图 */
    save2Image() {
      this.$confirm('确认导出当前屏幕为图片？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const blob = this.$cesiumHelper.save2blob()
        // 检查浏览器是否支持 File System Access API
        if ('showSaveFilePicker' in window) {
          // 配置文件保存对话框的选项
          const opts = {
            types: [{
              description: 'png 文件',
              accept: {
                'image/png': ['.png', '.jpg'],
              },
            }],
          };
          // 使用 showSaveFilePicker 方法显示文件保存对话框
          window.showSaveFilePicker(opts)
              .then((fileHandle) => {
                // 创建可写入文件的文件句柄
                return fileHandle.createWritable()
                    .then((writable) => {
                      // 写入 Blob 数据到文件
                      writable.write(blob);
                      // 关闭文件句柄
                      return writable.close();
                    });
              })
              .catch((err) => {
                // 处理保存文件时出现的错误
                console.error('保存文件出错:', err);
              });
        } else {
          // 如果不支持 File System Access API，提供仅设置名称的选项
          const fileName = prompt('请输入文件名', '态势标绘.json');
          if (!fileName) {
            // 用户取消输入，不进行保存
            return;
          }
          // 使用 FileSaver.js 保存文件，设置文件名为用户输入的名称
          saveAs(blob, fileName)
        }
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消保存'
        });
      });
    },
    /** 清除缓存 */
    clean() {
      this.$confirm('此操作将清除当前标绘记录，是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$cesiumHelper.removeAll()
        localStorage.removeItem("entities")
        this.$store.dispatch("removeAllSource")
        const startTime = this.$store.state.cesium.availability.split("/")[0]
        this.$cesiumHelper.setCurrentTime(startTime)
        this.$store.dispatch("setCurrentTime", startTime)
        this.$message({
          type: 'success',
          message: '清除完成!'
        });
      }).catch(err => {
        console.log(err);
        this.$message({
          type: 'info',
          message: '已取消操作'
        });
      });
    }
  }
}
</script>

<style scoped>
.tool-menu-item {
  padding: 0 20px;
  height: 100%;
  color: white;
  font-size: 12px;
  cursor: pointer;

  .tool-menu-item-title {
    width: 100%;
    height: 100%;
  }

  &:hover {
    background-color: #124078;
    color: #409eff;
  }
}

.el-dropdown-menu {
  border-radius: 0;
  margin-top: 5px;
  background-color: #f8f8f8;
}
</style>
