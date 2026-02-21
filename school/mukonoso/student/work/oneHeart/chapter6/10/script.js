const items=document.querySelecctor('.img-item')

const keyframes={
    opacity:[0,1]
};
const options={
    duraction:600,
    fill:'forwards',
}
items.animate(keyframes,options);