const heading=document.querySelector('#heading');
const heading1=document.querySelector('#sentence_1');
const heading2=document.querySelector('#sentence_2');
const heading3=document.querySelector('#sentence_3');

const keyframes={
    opacity:[0,1],
    translate:['0 50px', 0],
    rotate:['x 360deg',0]
};
const keyframes1={
    color:['#f66', '#fc2', '#0c6', '#0bd']
};
const keyframes2={
    color:['transparent', '#fff'],
    backgroundPosition:['100% 0', '0 0'],
}
const keyframes3={
    borderRadius:[
        '20% 50% 50% 70%/50% 50% 70% 50%',
        '50% 20% 50% 50% /40% 40% 60% 60%',
        '50% 40% 20% 40% /40% 50% 50% 80%',
        '50% 50% 50% 20%/40% 40% 60% 60%',
    ]
}

const options={
    duration:2000,
    easing:'ease',
};
const options1={
    delay:3000,
    duration: 8000,
    direction:'alternate',
    iterations:Infinity,
};
const options2={
    delay:5000,
    duration:1000,
    easing:'ease',
}
const options3={
    delay:7000,
    duration:8000,
    direction:'alternate',
    iterations:Infinity,
}

heading.animate(keyframes,options);
heading1.animate(keyframes1,options1);
heading2.animate(keyframes2,options2);
heading3.animate(keyframes3,options3);