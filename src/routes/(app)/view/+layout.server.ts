
import _ from 'lodash-es';

export const load = async ({ url, params }) => {
    let hexData = {
        path: '',
        ctype: '',
        type: '',
        size: '',
        dkey: '',
        storage: ''
    }
    const hex = url.searchParams.get('hex') || ''
    let filename = ''
    try {
        hexData = JSON.parse(Buffer.from(hex, 'hex').toString('utf-8'))
        filename = _.last(hexData?.path || '')?.split?.('/')?.reverse()?.[0] || '';
    } catch (error) {

    }
    return {
        ...hexData,
        ctype: url.searchParams.get('ctype') || '',
        hex: url.searchParams.get('hex') || '',
        filename,
        path: encodeURIComponent(decodeURIComponent(url.searchParams.get('path') || '')) || hexData.path || '',
    };
};
