import RaisedButton from 'material-ui/RaisedButton';
import { processing, cancelBuild } from '../../action/list';
import { connect } from 'react-redux';
import kill from 'tree-kill';
import { exec } from 'child_process';
import { remote } from 'electron';
import { setSnackbar } from '../../action/snackbar';
import path from 'path';

const { dialog } = remote;

const style = {
  margin: '0 4px'
};

const cwd = remote.app.getAppPath();

const ListBtns = ({ ftpSetting, btns, listId, listLocation, onProcess, cancelBuild, setSnackbar }) => {
  return (
    <div className="btn-group btn-group__right">
      {
        btns.map((btn, i) => (
          <RaisedButton
            key={i}
            className="btn"
            style={style}
            label={btn.get('name')}
            labelPosition="after"
            primary={btn.get('process')}
            secondary={btn.get('fail')}
            pid={btn.get('pid')}
            onClick={() => {
              if (btn.get('process')) {
                kill(btn.get('pid'));
              } else {
                let child = exec(`gulp ${btn.get('cmd')} --cwd ${listLocation} ${btn.get('flag')} --gulpfile ${cwd}/gulpfile.js`,  {cwd});

                child.stderr.on('data', data => {
                  const str = data.toString();

                  console.error('exec error: ' + str);
                  kill(btn.get('pid'));
                  cancelBuild(listId, i, btn.get('name'), child.pid, str, true);
                  dialog.showErrorBox('Oops， 出错了', str);
                });

                child.stdout.on('data', data => {
                  console.log(data.toString())
                  onProcess(listId, i, btn.get('text'), child.pid, data.toString())
                });

                // 关闭
                child.stdout.on('close', () => {
                  cancelBuild(listId, i, btn.get('name'), child.pid, '编译结束', false);
                  setSnackbar('编译结束');

                  console.info('编译结束');
                });
              }
            }}
          />
        ))
      }
    </div>
  )
};

const mapStateToProps = states => ({
  ftpSetting: states.setting.get('ftp')
});

const mapDispatchToProps = (dispatch) => ({
  onProcess: (listId, index, name, pid, data) => (
    dispatch(processing(listId, index, name, pid, data))
  ),
  cancelBuild: (listId, index, name, pid, data) => (
    dispatch(cancelBuild(listId, index, name, pid, data))
  ),
  setSnackbar: (msg) => dispatch(setSnackbar(msg))
});

export default connect(mapStateToProps, mapDispatchToProps)(ListBtns);
