<template>
  <div class="login">
    <div class="cesium-logo"></div>
    <el-form ref="loginForm" :model="loginForm" :rules="loginRules" class="login-form">
      <el-col :span="24">
<!--        <h3 class="title">可视化数字地球标绘系统</h3>-->
        <h3 class="title">数字化战例教学标绘系统</h3>
      </el-col>
      <el-col :span="24">
        <el-form-item prop="username">
          <el-input
              v-model="loginForm.username"
              type="text"
              placeholder="账号"
              prefix-icon="el-icon-user-solid"
          >
          </el-input>
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item prop="password">
          <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="密码"
              prefix-icon="el-icon-lock"
              @keyup.enter.native="handleLogin"
          >
          </el-input>
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item prop="code" v-if="captchaEnabled">
          <el-input
              v-model="loginForm.code"
              placeholder="验证码"
              style="width: 80%"
              prefix-icon="el-icon-finished"
              @keyup.enter.native="handleLogin"
          >
          </el-input>
          <div class="login-code">
            <img :src="codeUrl" @click="getCode" class="login-code-img"/>
          </div>
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item style="width:100%;padding-top: 20px">
          <el-button
              :loading="loading"
              size="medium"
              type="primary"
              style="width:100%;"
              @click.native.prevent="handleLogin"
          >
            <span v-if="!loading">登 录</span>
            <span v-else>登 录 中...</span>
          </el-button>
          <div style="float: right;" v-if="register">
            <router-link class="link-type" :to="'/register'">立即注册</router-link>
          </div>
        </el-form-item>
      </el-col>
    </el-form>
    <!--  底部  -->
    <div class="el-login-footer">
      <!--      <span>Copyright © 2018-2023 ruoyi.vip All Rights Reserved.</span>-->
    </div>
  </div>
</template>

<script>
import {getCodeImg, login} from "@/api/login";
import {encrypt} from '@/utils/jsencrypt'

export default {
  name: "Login",
  data() {
    return {
      codeUrl: "",
      loginForm: {
        username: "",
        password: "",
        code: "",
        uuid: ""
      },
      loginRules: {
        username: [
          { required: true, trigger: "blur", message: "请输入您的账号" }
        ],
        password: [
          { required: true, trigger: "blur", message: "请输入您的密码" }
        ],
        code: [
            { required: true, trigger: "change", message: "请输入验证码" }
        ]
      },
      loading: false,
      // 验证码开关
      captchaEnabled: true,
      // 注册开关
      register: false
    };
  },
  created() {
    this.getCode();
  },
  methods: {
    getCode() {
      getCodeImg().then(res => {
        this.captchaEnabled = res.captchaEnabled === undefined ? true : res.captchaEnabled;
        if (this.captchaEnabled) {
          this.codeUrl = "data:image/gif;base64," + res.img;
          this.loginForm.uuid = res.uuid;
        }
      });
    },
    handleLogin() {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          this.loading = true;
          localStorage.removeItem("username");
          localStorage.removeItem("password");
          const {username, password, code, uuid} = { ...this.loginForm }
          login(username, password, code, uuid).then(res => {
            let data = res.data
            localStorage.setItem("username", this.loginForm.username)
            localStorage.setItem("password", encrypt(this.loginForm.password))
            localStorage.setItem("token", data.access_token)
            this.$router.push("/").catch(()=>{});
          }).catch(() => {
            this.loading = false;
            if (this.captchaEnabled) {
              this.getCode();
            }
          })
        }
      });
    }
  }
};
</script>

<style lang="less">
.login {
  height: 100%;
  background-image: url("../assets/bg_image.png");
  background-size: cover;
  position: relative;
}
.cesium-logo{
  width: 500px;
  height: 500px;

  position: absolute;
  top: 50%;
  left: 15%;

  transform: translateY(-50%);

  background-image: url("../assets/earth.png");
  background-repeat: no-repeat;
  background-size: 100% 100%;
}
.title {
  margin: 0 auto 30px auto;
  text-align: center;
  font-size: 50px;
  color: #FFFFFF;
  letter-spacing: .1em;
  font-family: "黑体",serif;

}

.login-form {

  width: 610px;

  position: absolute;
  top: 50%;
  left: 50%;

  transform: translateY(-50%);
  padding: 25px 25px 5px 25px;

  .el-input {
    height: 38px;
    input {
      color: #FFFFFF;
      height: 38px;
      border: none;
      background-color: transparent;
      border-bottom:  1px solid #ffffff;
      border-radius: 0;

      font-family: "Microsoft YaHei",serif;
      font-size: 14px;
    }
  }
  .input-icon {
    height: 39px;
    width: 14px;
    margin-left: 2px;
  }
}
.login-tip {
  font-size: 13px;
  text-align: center;
  color: #bfbfbf;
}
.login-code {
  width: 20%;
  height: 38px;
  float: right;
  img {
    cursor: pointer;
    vertical-align: middle;
  }
}
.el-login-footer {
  height: 40px;
  line-height: 40px;
  position: fixed;
  bottom: 0;
  width: 100%;
  text-align: center;
  color: #fff;
  font-family: Arial,serif;
  font-size: 12px;
  letter-spacing: 1px;
}
.login-code-img {
  height: 38px;
}
</style>
