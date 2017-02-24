'use strict';

let Pane = require('./Pane');

class CMSPane extends Pane {
    /**
     * Gets the render settings
     *
     * @returns {Object} Settings
     */
    static getRenderSettings() {
        return {
            label: 'HashBrown',
            route: '/',
            $icon: _.img({src: '/svg/logo_white.svg', class: 'logo'}),
            items: [
                {
                    name: 'Welcome'
                },
                {
                    name: 'Readme',
                    path: 'readme'
                },
                {
                    name: 'License',
                    path: 'license'
                }
            ]
        };
    }
}

module.exports = CMSPane;
