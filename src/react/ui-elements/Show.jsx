function Show({ isShown, children }){
    console.log('isShown!!!', isShown);
    console.log('children!!!', children);
    if (isShown) {
        return children;
    }
    return null;
}

export default Show;
