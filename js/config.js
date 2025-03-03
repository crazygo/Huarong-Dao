// Game configuration file

// Board dimensions and units
const GRID_WIDTH = 4;
const GRID_HEIGHT = 5;
const UNIT_SIZE = 90; // 90px per unit

// Initial configuration of blocks
const initialBlocks = [
    { id: 'caocao', name: '曹操', width: 2, height: 2, x: 1, y: 1, color: '#ff5722' },
    { id: 'guanyu', name: '关羽', width: 2, height: 1, x: 0, y: 0, color: '#2196f3' },
    { id: 'zhangfei', name: '张飞', width: 1, height: 2, x: 0, y: 1, color: '#e91e63' },
    { id: 'zhaoyun', name: '赵云', width: 1, height: 2, x: 3, y: 0, color: '#ffeb3b' },
    { id: 'huangzhong', name: '黄忠', width: 1, height: 2, x: 3, y: 2, color: '#673ab7' },
    { id: 'machao', name: '马超', width: 2, height: 1, x: 0, y: 4, color: '#ffc107' },
    { id: 'zu1', name: '卒(右上)', width: 1, height: 1, x: 2, y: 0, color: '#4caf50' },
    { id: 'zu2', name: '卒(左中)', width: 1, height: 1, x: 0, y: 3, color: '#45a247' },
    { id: 'zu3', name: '卒(中下)', width: 1, height: 1, x: 1, y: 3, color: '#5cb860' },
    { id: 'zu4', name: '卒(右下)', width: 1, height: 1, x: 2, y: 4, color: '#388e3c' }
];

// Direction mapping
const DIRECTIONS = [
    { dx: 1, dy: 0, name: '右' },  // right
    { dx: -1, dy: 0, name: '左' }, // left
    { dx: 0, dy: 1, name: '下' },  // down
    { dx: 0, dy: -1, name: '上' }  // up
]; 