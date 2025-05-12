/**
 * 编组类
 *
 * 编组概念实体创建及编辑
 * */

import * as uuid from "../common/uuid"
import * as dateUtils from "../common/dateUtils";
class Group{

    /** 根目录 */
    root = null

    /** 编组资源 */
    groupMap = null

    /** Cesium实例对象 */
    viewer = null

    /** CesiumHelper 对象 */
    supper = null

    constructor(viewer, supper) {
        this.viewer = viewer
        this.supper = supper
        this.groupMap = new Map()
        /** 添加根节点 */
        this.root = this._createRoot()
        this.viewer.root = this.root
        this.groupMap.set(this.root.id, this.root)
    }

    /**
     * 创建分组
     *
     * @param {*} options 相关参数  包括 名称、父级id
     * */
    createGroup(options){
        const id = options?.id || uuid.uuid()
        const temp = {
            id: id,
            name: options?.name || "新建分组",
            type: "group",
            data: options?.data,
            sort: options?.sort || 1,
            groupId: options?.groupId || this.viewer.root?.id,
            show: true
        }
        this.groupMap.set(id, temp)
        this.viewer.resource.set(id, this.getGroupToJson(temp))
        return temp
    }

    /**
     * 创建分组
     *
     * @param {*} options 相关参数  包括 名称、父级id
     * */
    loadGroupForData(options){
        return new Promise(resolve => {
            const temp = {
                id: options.id,
                name: options.name,
                type: "group",
                data: options.data,
                sort: options.sort,
                groupId: options.groupId,
                show: options.show
            }
            this.groupMap.set(options.id, temp)
            this.viewer.resource.set(options.id, temp)
            resolve(temp)
        })
    }

    /**
     * 编辑分组
     *
     * @param {*} source 实体
     * @param {*} options 相关参数
     * */
    editGroup(source, options){
        "name" in options && (source.name = options.name)
        "groupId" in options && (source.groupId = options.groupId)
        "data" in options && (source.data = options.data)
        "sort" in options && (source.sort = options.sort)
        if ("availability" in options){
            this._changeGroupAvailability(source.id, options.availability)
        }
        this.viewer.resource.set(source.id, this.getGroupToJson(source))
    }

    /**
     * 删除分组
     *
     * @param {String} id 实体 id
     * */
    removeById(id){
        if (this.viewer.root?.id === id) return
        // 此处借助递归删除所有子元素
        const elements = Array.from(this.viewer.resource.values()).filter(p=>p.groupId === id)
        elements.forEach(item => this.supper.deleteObjById(item.id))
        this.groupMap.delete(id)
    }

    /** 删除所有元素 */
    removeAll(){
        for(const [key,] of this.groupMap){
            if (key === this.root.id) continue;
            this.viewer.resource.delete(key)
        }
        this.groupMap = new Map([[this.root.id, this.root]])
    }

    /** 根据 id 获取分组信息 */
    getGroupById(id){
        return this.groupMap.get(id)
    }

    /** 获取分组 json */
    getGroupToJson(group){
        const availability = this._computeGroupAvailability(group.id)
        const temp = {
            id: group.id,
            name: group.name,
            type: group.type,
            show: group.show,
            data: group.data || null,
            sort: group.sort || 1,
            groupId: group.groupId,
        }
        if (group.type !== "root" && availability != null) {
            temp["startTime"] = availability[0]
            temp["endTime"] = availability[1]
        }
        return temp
    }

    /** 获取分组列表 */
    getGroupToList(){
        const result = []
        for (let [, value] of this.groupMap) {
            result.push(this.getGroupToJson(value))
        }
        return result
    }

    /** 获取分组树 */
    getGroupToTree(){
        const rootItems = [];
        const lookup = {};
        // 首先，将每个项的引用存储在一个查找表中
        for (const [, item] of this.viewer.resource) {
            const itemId = item['id'];
            const parentId = item['groupId'];
            // 如果不存在对应的id，则初始化一个children数组
            if (!lookup[itemId]) lookup[itemId] = {['children']: []};
            // 将属性拷贝到这个对象中
            lookup[itemId] = {...item, ['children']: lookup[itemId]['children']};
            const TreeItem = lookup[itemId];
            if (parentId === null || parentId === undefined || parentId === '') {
                // 如果parentId为空，表示是根节点
                rootItems.push(TreeItem);
            } else {
                // 如果不是根节点，则添加到其父项的children数组中
                if (!lookup[parentId]) lookup[parentId] = {['children']: []};
                lookup[parentId]['children'].push(TreeItem);
            }
        }
        return rootItems;
    }

    /** 导出编组内容 */
    export(id){
        const elements = this._findAllChildren(Array.from(this.viewer.resource.values()), id)
        elements.push(this.getGroupToJson(this.getGroupById(id)))
        return elements
    }

    /**
     * 递归查找所有子元素
     *
     * 感觉 resource 完全可以被优化掉
     * 采用递归逻辑是可以跳过resource
     * 直接获取所有元素 JSON 的
     * 此处注释  后期优化要注意
     * @param {Array} objects 元素列表
     * @param {String} parentId 元素 id
     * */
    _findAllChildren(objects, parentId) {
        let children = [];
        // 找到所有直接子元素
        objects.forEach(obj => {
            if (obj.groupId === parentId) {
                children.push(obj);
                // 递归地找到当前子元素的所有子元素
                children = children.concat(this._findAllChildren(objects, obj.id));
            }
        });
        return children;
    }

    /**
     * 创建根节点
     * */
    _createRoot(){
        const temp = this.viewer.root || {
            id: uuid.uuid(),
            name: "根目录",
            type: "root",
            show: true
        }
        this.groupMap.set(temp.id, temp)
        this.viewer.resource.set(temp.id, this.getGroupToJson(temp))
        return temp
    }

    /**
     * 计算组何内所有实体的最早时间和最晚时间作为组何的时间
     *
     * @param {String} id 编组 id
     * */
    _computeGroupAvailability(id){
        const elements = this._findAllChildren(Array.from(this.viewer.resource.values()), id).filter(p=>p.type !== "group")
        if (elements.length === 0) return null
        const start = elements.reduce((pre, cur) => new Date(pre.startTime).getTime() > new Date(cur.startTime).getTime() ? cur : pre)
        const end = elements.reduce((pre, cur) => new Date(pre.endTime).getTime() > new Date(cur.endTime).getTime() ? pre : cur)
        return [start.startTime, end.endTime]
    }

    /**
     * 修改编组时间
     *
     * 由于修改编组时间会影响所有子元素时间
     * 故此处应考虑两点
     * 1. 考虑修改后的时间偏移
     * 2. 考虑修改后的时间缩放 (先不考虑-太麻烦)
     * 根据偏移和缩放分别计算出所有子元素的相对时间
     * 然后递归修改即可
     * */
    _changeGroupAvailability(id, availability){
        const times = this._computeGroupAvailability(id)
        // 如果编组不存在时间 则说明编组没有其他子元素 则不可以修改其时间
        if ( times==null ) return
        // 计算 编组的时间偏移量
        const startTime = availability.split("/")[0].replace("T", " ").replace("Z", "")
        const newStartTime = new Date(startTime)
        const oldStartTime = new Date(times[0])
        const distance = (newStartTime.getTime() - oldStartTime.getTime()) / 1000
        // 遍历子类元素 计算对应元素周期
        for (const [key, item] of this.viewer.resource){
            if (item.groupId !== id || !item.startTime || !item.endTime) continue;
            const startDate = dateUtils.dateDistance(new Date(item.startTime), distance)
            const endDate = dateUtils.dateDistance(new Date(item.endTime), distance)
            let availability = dateUtils.parseDateToString("yyyy-MM-ddTHH:mm:ssZ", startDate) + "/" + dateUtils.parseDateToString("yyyy-MM-ddTHH:mm:ssZ", endDate)
            // 如果类型为摄像头 则只需要结束时间
            if (item.type === "camera") availability = dateUtils.parseDateToString("yyyy-MM-ddTHH:mm:ssZ", endDate)
            this.supper.updateObjById(key, {availability: availability})
        }
    }

}

export default Group
