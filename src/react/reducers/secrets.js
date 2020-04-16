import { initialSecretsState } from './initialConstants';

export default function secrets(state = initialSecretsState, action){
    switch (action.type) {
    case 'ADD_SECRET':
        return state.set(action.keys.accessKey, action.keys.secretKey);
    case 'DELETE_SECRET':
        return state.delete(action.accessKey);
    default:
        return state;
    }
}
