function Hide({ isHidden, children }){
    if (isHidden) {
        return null;
    }
    return children;
}

export default Hide;
