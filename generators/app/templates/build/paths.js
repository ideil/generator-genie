const
    path = require('path'),
    BuildPaths = {};

BuildPaths.Root = 'static';

BuildPaths.RSource = path.join(BuildPaths.Root, 'src');

BuildPaths.MProduction = 'pub';
BuildPaths.RProduction = path.join(BuildPaths.Root, BuildPaths.MProduction);

BuildPaths.RTwig = path.join(BuildPaths.Root, 'twig');
BuildPaths.RHtml = path.join(BuildPaths.Root, 'html');

BuildPaths.RSass = path.join(BuildPaths.RSource, 'sass');
BuildPaths.RStylesD = path.join(BuildPaths.RSource, 'css');
BuildPaths.RStylesP = path.join(BuildPaths.RProduction, 'css');
BuildPaths.MStylesD = path.join('src', 'css');
BuildPaths.MStylesP = path.join(BuildPaths.MProduction, 'css');

BuildPaths.RScripts = path.join(BuildPaths.RSource, 'js');
BuildPaths.MScripts = path.join(BuildPaths.MProduction, 'js');

BuildPaths.RImagesP = path.join(BuildPaths.RSource, 'img');
BuildPaths.RImagesD = path.join(BuildPaths.RProduction, 'img');
BuildPaths.MImages = path.join(BuildPaths.MProduction, 'img');

module.exports = BuildPaths;
