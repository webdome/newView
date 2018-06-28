/* 
var svd = require('simple-virtual-dom')

var el = svd.el
var diff = svd.diff
var patch = svd.patch

// 1. use `el(tagName, [propeties], children)` to create a virtual dom tree
var tree = el('div', {'id': 'container'}, [
    el('h1', {style: 'color: blue'}, ['simple virtal dom']),
    el('p', ['Hello, virtual-dom']),
    el('ul', [el('li')])
])

// 2. generate a real dom from virtual dom. `root` is a `div` element
var root = tree.render()

// 3. generate another different virtual dom tree
var newTree = el('div', {'id': 'container'}, [
    el('h1', {style: 'color: red'}, ['simple virtal dom']),
    el('p', ['Hello, virtual-dom']),
    el('ul', [el('li'), el('li')])
])

// 4. diff two virtual dom trees and get patches
var patches = diff(tree, newTree)

// 5. apply patches to real dom
patch(root, patches)

// now the `root` dom is updated
*/
const HTMLParser = require('./htmlparser')
const svd = require('simple-virtual-dom');
const El = svd.el;

// if (typeof module === 'object' && typeof module.exports === 'object') {
//     require('./htmlparser.js');
// }

// function removeDOCTYPE(html) {
//     return html
//         .replace(/<\?xml.*\?>\n/, '')
//         .replace(/<!doctype.*\>\n/, '')
//         .replace(/<!DOCTYPE.*\>\n/, '');
// }

function getElementTree(html) {
    // html = removeDOCTYPE(html);
    let bufArray = [];
    let results = {
        children:[],
        tag:'root'
    };
    HTMLParser(html, {
        start: function(tag, attrs, unary) {
            let elOption = {};
            elOption.tag = tag;
            if (attrs.length !== 0) {
                elOption.props = attrs.reduce(function(pre, attr) {
                    pre[attr.name] = attr.value;
                    return pre;
                }, {});
            }
            if (unary) {
                let parent = bufArray[0] || results;
                if (parent.children === undefined) {
                    parent.children = [];
                }
                parent.children.push(new El(elOption.tag,elOption.props,elOption.children));
            } else {
                bufArray.unshift(elOption);
            }
        },
        end: function(tag) {
            let elOption = bufArray.shift();
            if (elOption.tag !== tag) throw new Error('template标签使用不规范');

            let el = new El(elOption.tag,elOption.props,elOption.children);

            if (bufArray.length === 0) {
                results.children.push(el);
            } else {
                let parent = bufArray[0];
                if (parent.children === undefined) {
                    parent.children = [];
                }
                parent.children.push(el);
            }
        },
        chars: function(text) {
            if(!text.trim()) return;

            if (bufArray.length === 0) {
                throw new Error('template 必须只有一个顶级节点')
            } else {
                let parent = bufArray[0];
                if (parent.children === undefined) {
                    parent.children = [];
                }
                parent.children.push(text);
            }
        },
        comment: function(text) {
            //不对注释做处理
        }
    });
    if(results.children.length !== 1){
        // throw new Error('顶级节点必须有且只有一个');
        results.children = [new El('div',{},results.children)];
    }
    return results.children[0];
}

module.exports = getElementTree;
